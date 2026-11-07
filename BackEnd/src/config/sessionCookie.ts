const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" as const : "lax" as const,
  path: "/",
};
