import express from "express";
import cors from "cors";
//Routes
import RegisterRoutes from "./src/routes/register.routes";
import LoginRoutes from "./src/routes/login.routes";
import MeRoutes from "./src/routes/me.routes";
//Middlewares
import { errorHandler } from "./src/middlewares/erroHandler";
const app = express();
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] // Garante que o OPTIONS seja aceito
}));
app.use(express.json());
app.use("/register", RegisterRoutes);
app.use("/login", LoginRoutes);
app.use("/me", MeRoutes);
app.use(errorHandler);
app.listen(3000, () => {
    console.log(`Server Rodando Na Porta 3000`);
})