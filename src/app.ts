// src/app.ts
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { apiReference } from "@scalar/express-api-reference";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";

import { html } from "./lib/constants";
import { generateOpenAPIDocument, registerOpenAPIRoutes } from "./lib/openapi-registry";
import userRouter from "./routes/users";

const app: Express = express();

// 🔹 Global rate limiting (all routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(globalLimiter);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// OpenAPI
// registerOpenAPIRoutes(productsOpenAPI);
const openApiDocument = generateOpenAPIDocument();
app.get("/docs/openapi.json", (req, res) => res.json(openApiDocument));

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// API Reference Docs
app.use(
  "/docs",
  apiReference({
    theme: "kepler",
    layout: "modern",
    defaultHttpClient: { targetKey: "js", clientKey: "fetch" },
    url: "/docs/openapi.json",
  })
);

// Routes
// app.use("/api/products", productsRouter);
app.use("/api/users", userRouter); // ✅ user router

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
