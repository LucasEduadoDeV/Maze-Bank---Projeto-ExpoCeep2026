import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import cookieParser from "cookie-parser";
//Routes
import RegisterRoutes from "./src/routes/register.routes";
import LoginRoutes from "./src/routes/login.routes";
import LogoutRoutes from "./src/routes/logout.routes";
import MeRoutes from "./src/routes/me.routes";
import TransactionRoutes from "./src/routes/transaction.routes";
import CardsRoutes from "./src/routes/cards.routes";
import BillsRoutes from "./src/routes/bills.routes";
import InvoicesRoutes from "./src/routes/invoices.routes";
//Middlewares
import { errorHandler } from "./src/middlewares/erroHandler";
import { attachRealtime } from "./src/realtime";
const app = express();
app.set('trust proxy', 1);
//Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/config/swagger'

const allowedOrigins = [
  'https://maze-bank-projeto-expoceep2026.onrender.com'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    let isLocalDevelopmentOrigin = false;
    try {
      const url = new URL(origin);
      isLocalDevelopmentOrigin = url.protocol === 'http:'
        && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    } catch {
      isLocalDevelopmentOrigin = false;
    }

    callback(null, allowedOrigins.includes(origin) || isLocalDevelopmentOrigin ? origin : false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/register", RegisterRoutes);
app.use("/api/login", LoginRoutes);
app.use("/api/logout", LogoutRoutes);
app.use("/api/me", MeRoutes);
app.use("/api/transaction", TransactionRoutes);
app.use("/api/cards", CardsRoutes);
app.use("/api/bills", BillsRoutes);
app.use("/api/invoices", InvoicesRoutes);
app.use(errorHandler);
const server = createServer(app);
attachRealtime(server);

const PORT = Number(process.env.PORT ?? 3000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Rodando Na Porta ${PORT}`);
});
