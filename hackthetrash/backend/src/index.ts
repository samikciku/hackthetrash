import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import reportsRouter from "./routes/reports";
import authRouter from "./routes/auth";
import devicesRouter from "./routes/devices";
import adminRouter from "./routes/admin";

const app = express();
const PORT = process.env.PORT || 4000;

// Trust the first proxy so req.ip works behind Vercel/Railway/nginx
app.set("trust proxy", 1);

// Lock down CORS to known origins; "*" is fine for the dev demo.
const allowedOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim());
app.use(cors({
  origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  credentials: true
}));

// Hardening headers (lightweight - if you want full helmet, add the dep)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_req, res) => res.json({ ok: true, service: "HackTheTrash API" }));
app.get("/health", (_req, res) => res.json({ status: "healthy" }));

app.use("/api/reports", reportsRouter);
app.use("/api/auth", authRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/admin", adminRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`HackTheTrash API running on http://localhost:${PORT}`);
});
