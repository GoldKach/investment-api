
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import userRouter from "./routes/users";
import authRouter from "./routes/auth";
import onboardingRouter from "./routes/onboarding";
import assetsRouter from "./routes/assets";
import portfolioRouter from "./routes/portfolio";
import portfolioAssetRouter from "./routes/portfolio-assets";

const app = express();

// ✅ Updated CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',  // Your Next.js frontend
    'http://localhost:3001',  // Alternative if needed
  ],
  credentials: true,          // Allow credentials (Authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
}));

app.use(express.json());

// Routes
app.use("/api/v1", userRouter);
app.use("/api/v1", authRouter);
app.use("/api/v1", onboardingRouter);
app.use("/api/v1", assetsRouter);
app.use("/api/v1", portfolioRouter);
app.use("/api/v1", portfolioAssetRouter);



// Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;