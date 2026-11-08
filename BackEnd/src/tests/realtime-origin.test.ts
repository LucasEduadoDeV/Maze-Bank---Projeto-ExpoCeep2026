import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedOrigin } from "../realtime";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("WebSocket origin validation", () => {
  it("allows the production frontend origin", () => {
    expect(isAllowedOrigin("https://maze-bank-projeto-expoceep2026.onrender.com")).toBe(true);
  });

  it("allows frontend origins configured for HTTP", () => {
    vi.stubEnv("FRONTEND_URLS", "https://app.example.com,https://admin.example.com");

    expect(isAllowedOrigin("https://app.example.com")).toBe(true);
    expect(isAllowedOrigin("https://admin.example.com")).toBe(true);
  });

  it("allows explicitly configured WebSocket origins", () => {
    vi.stubEnv("WS_ALLOWED_ORIGINS", "https://realtime.example.com");

    expect(isAllowedOrigin("https://realtime.example.com")).toBe(true);
  });

  it("rejects unknown origins and missing origins", () => {
    expect(isAllowedOrigin("https://untrusted.example.com")).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(false);
  });
});
