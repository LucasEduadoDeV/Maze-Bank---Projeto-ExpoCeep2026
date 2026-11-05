import type { IncomingMessage, Server } from "node:http";
import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";

const TOKEN_COOKIE = "__user__token__";
const DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

interface AuthenticatedSocket extends WebSocket {
  userId: string;
  sessionToken: string;
  isAlive: boolean;
  expirationTimer: NodeJS.Timeout;
}

const socketsByUser = new Map<string, Set<AuthenticatedSocket>>();

function getCookieValue(request: IncomingMessage, name: string) {
  const cookies = request.headers.cookie?.split(";") ?? [];
  const cookie = cookies.map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return cookie ? cookie.slice(name.length + 1) : null;
}

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) return false;

  const configuredOrigins = process.env.WS_ALLOWED_ORIGINS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) return configuredOrigins.includes(origin);

  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.protocol === "http:" && DEVELOPMENT_HOSTS.has(parsedOrigin.hostname);
  } catch {
    return false;
  }
}

function rejectUpgrade(request: IncomingMessage, status: number, message: string) {
  const socket = request.socket;
  if (socket.destroyed) return;
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

export function attachRealtime(server: Server) {
  const webSocketServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url?.split("?")[0] !== "/ws") {
      rejectUpgrade(request, 404, "Not Found");
      return;
    }

    if (!isAllowedOrigin(request.headers.origin)) {
      rejectUpgrade(request, 403, "Forbidden");
      return;
    }

    const secret = process.env.JWT_SECRET;
    const token = getCookieValue(request, TOKEN_COOKIE);
    if (!secret || !token) {
      rejectUpgrade(request, 401, "Unauthorized");
      return;
    }

    let userId: string;
    let expiresAt: number;
    try {
      const verified = jwt.verify(token, secret, { algorithms: ["HS256"] });
      if (
        typeof verified === "string"
        || typeof verified.sub !== "string"
        || typeof verified.exp !== "number"
      ) {
        rejectUpgrade(request, 401, "Unauthorized");
        return;
      }
      userId = verified.sub;
      expiresAt = verified.exp;
    } catch {
      rejectUpgrade(request, 401, "Unauthorized");
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      const authenticatedSocket = webSocket as AuthenticatedSocket;
      authenticatedSocket.userId = userId;
      authenticatedSocket.sessionToken = token;
      authenticatedSocket.isAlive = true;
      authenticatedSocket.expirationTimer = setTimeout(
        () => authenticatedSocket.close(4401, "Session expired"),
        Math.max(0, expiresAt * 1000 - Date.now()),
      );

      const userSockets = socketsByUser.get(authenticatedSocket.userId) ?? new Set();
      userSockets.add(authenticatedSocket);
      socketsByUser.set(authenticatedSocket.userId, userSockets);

      authenticatedSocket.on("pong", () => {
        authenticatedSocket.isAlive = true;
      });
      authenticatedSocket.on("message", () => {
        authenticatedSocket.close(1008, "Client messages are not supported");
      });
      authenticatedSocket.on("close", () => {
        clearTimeout(authenticatedSocket.expirationTimer);
        userSockets.delete(authenticatedSocket);
        if (userSockets.size === 0) socketsByUser.delete(authenticatedSocket.userId);
      });

      webSocketServer.emit("connection", authenticatedSocket, request);
    });
  });

  const heartbeat = setInterval(() => {
    for (const userSockets of socketsByUser.values()) {
      for (const webSocket of userSockets) {
        if (!webSocket.isAlive) {
          webSocket.terminate();
          continue;
        }
        webSocket.isAlive = false;
        webSocket.ping();
      }
    }
  }, 30_000);

  server.on("close", () => {
    clearInterval(heartbeat);
    webSocketServer.close();
  });
}

export function notifyUserAccountUpdated(userId: string) {
  const message = JSON.stringify({ type: "account.updated" });
  for (const webSocket of socketsByUser.get(userId) ?? []) {
    if (webSocket.readyState === WebSocket.OPEN) webSocket.send(message);
  }
}

export function disconnectSocketsForToken(token: string | undefined) {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token) return;

  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof payload !== "string" && typeof payload.sub === "string") {
      for (const webSocket of socketsByUser.get(payload.sub) ?? []) {
        if (webSocket.sessionToken === token) webSocket.close(4401, "Session ended");
      }
    }
  } catch {
    // Logout must still clear expired or invalid cookies.
  }
}
