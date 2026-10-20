import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
//Routes
import RegisterRoutes from "./src/routes/register.routes";
import LoginRoutes from "./src/routes/login.routes";
import MeRoutes from "./src/routes/me.routes";
//Middlewares
import { errorHandler } from "./src/middlewares/erroHandler";
const app = express();
app.use(cors({
  origin: 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser())
app.use("/register", RegisterRoutes);
app.use("/login", LoginRoutes);
app.use("/me", MeRoutes);
app.use(errorHandler);
app.listen(3000, () => {
    console.log(`Server Rodando Na Porta 3000`);
})