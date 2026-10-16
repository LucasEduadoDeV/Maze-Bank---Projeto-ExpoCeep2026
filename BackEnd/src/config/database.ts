import "dotenv/config";
import { Pool } from "pg";

const port = Number(process.env.DB_PORT ?? 5432);

if (!process.env.DB_HOST || !process.env.DB_DATABASE || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error("Variáveis do banco não configuradas.");
}

if (Number.isNaN(port)) {
  throw new Error("DB_PORT deve ser um número válido.");
}

const db = new Pool({
  host: process.env.DB_HOST,
  port,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export default db;