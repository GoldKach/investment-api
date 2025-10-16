
// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import cors from "cors";
// import userRouter from "./routes/users";

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/v1", userRouter);

// // Server
// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on http://localhost:${PORT}`);
// });
// export default app;

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import userRouter from "./routes/users";
import authRouter from "./routes/auth";

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
app.use("/api/v1", authRouter);          // ⬅️ add this (keeps your /auth/... paths)


// Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;