import type { Request, Response } from "express";
import { disconnectSocketsForToken } from "../realtime";

export function logoutController(req: Request, res: Response) {
    disconnectSocketsForToken(req.cookies?.__user__token__)

    res.clearCookie("__user__token__", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
    });

    return res.status(200).json({ loggedOut: true });
}
