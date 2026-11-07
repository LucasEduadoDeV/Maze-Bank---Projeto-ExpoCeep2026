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

app.use(cors({
  origin: 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/register", RegisterRoutes);
app.use("/login", LoginRoutes);
app.use("/logout", LogoutRoutes);
app.use("/me", MeRoutes);
app.use("/transaction", TransactionRoutes);
app.use("/cards", CardsRoutes);
app.use("/bills", BillsRoutes);
app.use("/invoices", InvoicesRoutes);
app.use(errorHandler);
const server = createServer(app);
attachRealtime(server);

const PORT = Number(process.env.PORT ?? 3000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Rodando Na Porta ${PORT}`);
});
