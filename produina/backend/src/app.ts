import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { aiRouter } from "./routes/aiRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { bacRouter } from "./routes/bacRoutes.js";
import { designRouter } from "./routes/designRoutes.js";
import { orderRouter } from "./routes/orderRoutes.js";
import { productRouter } from "./routes/productRoutes.js";
import { uploadRouter } from "./routes/uploadRoutes.js";
import { userRouter } from "./routes/userRoutes.js";

export const app = express();
app.disable("x-powered-by");
app.locals.databaseReady = false;
app.use(helmet());
const allowedOrigins = new Set([
  env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
]);
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.has(origin)),
    credentials: false,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "8mb" }));
app.get("/api/health", (_request, response) =>
  response.json({
    success: true,
    data: {
      status: app.locals.databaseReady ? "ok" : "degraded",
      database: app.locals.databaseReady,
    },
  }),
);
app.use((request, response, next) => {
  if (!app.locals.databaseReady && request.path !== "/api/health") {
    response
      .status(503)
      .json({
        success: false,
        message:
          "Database unavailable. Apply the Supabase migrations for the configured project, then restart the API.",
      });
    return;
  }
  next();
});
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productRouter);
app.use("/api/bac", bacRouter);
app.use("/api/designs", designRouter);
app.use("/api/orders", orderRouter);
app.use("/api/ai", aiRouter);
app.use("/api/users", userRouter);
app.use("/api/uploads", uploadRouter);
app.use(notFound);
app.use(errorHandler);
