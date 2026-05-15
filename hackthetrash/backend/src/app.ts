import express from "express";
import cors from "cors";
import path from "path";
import reportsRouter from "./routes/reports";
import authRouter from "./routes/auth";
import devicesRouter from "./routes/devices";
import adminRouter from "./routes/admin";
import commentsRouter from "./routes/comments";
import flagsRouter from "./routes/flags";
import profileRouter from "./routes/profile";
import emailSubsRouter from "./routes/email-subscriptions";

export function createApp(): express.Express {
  const app = express();

  app.set("trust proxy", 1);

  const allowedOrigins = (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim());
  app.use(cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    credentials: true
  }));

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
    next();
  });

  app.use(express.json({ limit: "1mb" }));
  const uploadsDir = path.join(__dirname, "../uploads");
  // Expose under `/api/uploads` so the same paths work behind Vercel Services (API prefix `/api`)
  app.use("/api/uploads", express.static(uploadsDir));
  app.use("/uploads", express.static(uploadsDir));

  app.get("/", (_req, res) => res.json({ ok: true, service: "HackTheTrash API" }));
  const healthPayload = () => ({ status: "healthy" as const });
  app.get("/health", (_req, res) => res.json(healthPayload()));
  app.get("/api/health", (_req, res) => res.json(healthPayload()));

  app.use("/api/reports", reportsRouter);
  app.use("/api/reports", commentsRouter); // /api/reports/:id/comments
  app.use("/api/reports", flagsRouter);    // /api/reports/:id/flags
  app.use("/api/auth", authRouter);
  app.use("/api/devices", devicesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/email-subscriptions", emailSubsRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  return app;
}
