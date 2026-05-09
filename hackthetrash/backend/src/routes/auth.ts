import { Router } from "express";

const router = Router();

router.post("/register", (_req, res) => {
  res.json({ message: "Stub: register" });
});
router.post("/login", (_req, res) => {
  res.json({ message: "Stub: login", token: "fake-jwt-token" });
});

export default router;
