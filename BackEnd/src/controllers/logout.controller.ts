import type { Request, Response } from "express";
import { disconnectSocketsForToken } from "../realtime";
import { sessionCookieOptions } from "../config/sessionCookie";

export function logoutController(req: Request, res: Response) {
    disconnectSocketsForToken(req.cookies?.__user__token__)

    res.clearCookie("__user__token__", sessionCookieOptions);

    return res.status(200).json({ loggedOut: true });
}
