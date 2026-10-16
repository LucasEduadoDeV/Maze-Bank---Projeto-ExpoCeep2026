import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import db from "./database";
const adapter = new PrismaPg(db);
const prisma = new PrismaClient({ adapter });
export default prisma;