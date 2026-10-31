import "dotenv/config";
import { defineConfig } from "prisma/config";
const { DB_HOST, DB_PORT = "5432", DB_DATABASE, DB_USER, DB_PASSWORD } = process.env;
if (!DB_HOST || !DB_DATABASE || !DB_USER || !DB_PASSWORD) {
  throw new Error("Configure DB_HOST, DB_DATABASE, DB_USER e DB_PASSWORD no .env.");
}
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
