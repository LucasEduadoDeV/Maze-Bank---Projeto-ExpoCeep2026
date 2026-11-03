import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const {
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_DATABASE = "placeholder",
  DB_USER = "placeholder",
  DB_PASSWORD = "placeholder"
} = process.env;

const datasourceUrl = new URL("postgresql://localhost");
datasourceUrl.hostname = DB_HOST;
datasourceUrl.port = DB_PORT;
datasourceUrl.username = DB_USER;
datasourceUrl.password = DB_PASSWORD;
datasourceUrl.pathname = `/${encodeURIComponent(DB_DATABASE)}`;
datasourceUrl.searchParams.set("schema", "public");
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: datasourceUrl.toString(),
  },
});