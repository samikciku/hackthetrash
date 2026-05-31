import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import {
  listReports,
  createReport,
  getReport,
  updateStatus
} from "../controllers/reportController";
import { optionalAuth } from "../middleware/auth";
import { useMemoryUploads } from "../services/reportPhotoUpload";

const router = Router();

const storage = useMemoryUploads()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, path.join(__dirname, "../../uploads")),
      filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`)
    });
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  }
});

router.get("/", listReports);
router.get("/:id", getReport);
router.post("/", optionalAuth, upload.array("photos", 5), createReport);
router.patch("/:id/status", updateStatus);

export default router;
