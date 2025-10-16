// routes/auth.ts
import { forgotPassword, resetPassword } from "@/controllers/auth";
import { Router } from "express";

const authRouter = Router();
authRouter.post("/auth/forgot-password", forgotPassword);
authRouter.post("/auth/reset-password", resetPassword);
export default authRouter;
