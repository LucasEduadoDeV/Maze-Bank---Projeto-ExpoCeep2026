import type { Request, Response } from "express";

export function logoutController(_req: Request, res: Response) {
    res.clearCookie("__user__token__", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
    });

    return res.status(200).json({ loggedOut: true });
}
