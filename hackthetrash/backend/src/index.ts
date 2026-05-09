import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import reportsRouter from "./routes/reports";
import authRouter from "./routes/auth";
import devicesRouter from "./routes/devices";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_req, res) => res.json({ ok: true, service: "HackTheTrash API" }));
app.get("/health", (_req, res) => res.json({ status: "healthy" }));

app.use("/api/reports", reportsRouter);
app.use("/api/auth", authRouter);
app.use("/api/devices", devicesRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`🗑️  HackTheTrash API running on http://localhost:${PORT}`);
});
