import express from "express";
import cors from "cors";
//Routes
import RegisterRoutes from "./src/routes/register.routes";
import LoginRoutes from "./src/routes/login.routes"
//Middlewares
import { errorHandler } from "./src/middlewares/erroHandler";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/register", RegisterRoutes);
app.use("/login", LoginRoutes)
app.use(errorHandler);
app.listen(3000, () => {
    console.log(`Server Rodando Na Porta 3000`);
})