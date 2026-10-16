import bcrypt from "bcrypt"
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../errors/AppError";
//Repository
import { registerRepository } from "../repositories/register.repository";
export async function makePasswordHash(password: string) {
    const hash = await bcrypt.hash(password, 10);

    return hash;
}
export async function validateErrors(name: string, email: string, cpf: string, passwordHash: string) {
    try {
        await registerRepository(name, email, cpf, passwordHash);
    } catch (error: unknown) {
        if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    ) {
        const meta = error.meta as {
            target?: string | string[];
            driverAdapterError?: {
                cause?: { constraint?: { index?: string } };
            };
        };
        const constraint = [
            ...(Array.isArray(meta.target) ? meta.target : [meta.target]),
            meta.driverAdapterError?.cause?.constraint?.index,
        ].filter(Boolean).join(" ").toLowerCase();
        if (constraint.includes("email")) {
            throw new AppError("Este e-mail já está cadastrado.", 409, "email");
        }
        if (constraint.includes("cpf")) {
            throw new AppError("Este CPF já está cadastrado.", 409, "cpf");
        }
        throw new AppError("E-mail ou CPF já cadastrado.", 409);
    }
  throw error;
}}