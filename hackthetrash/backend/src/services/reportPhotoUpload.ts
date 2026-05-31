import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuid } from "uuid";
import type { Express } from "express";

/**
 * When true, multer uses memory storage and photos must be persisted via Blob or similar
 * (Vercel serverless has no durable local disk). Set HACKTHETRASH_INTEGRATED_API=1 when
 * running the API only through Next.js (`next dev`) so disk paths are not used.
 */
export function useMemoryUploads(): boolean {
  return (
    process.env.VERCEL === "1" ||
    !!process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.HACKTHETRASH_INTEGRATED_API === "1"
  );
}

export type TempImagePaths = {
  paths: string[];
  cleanup: () => void;
};

/** Build filesystem paths for AI moderation; for memory buffers writes to /tmp. */
export function tempPathsForModeration(files: Express.Multer.File[]): TempImagePaths {
  const paths: string[] = [];
  const toUnlink: string[] = [];

  for (const f of files) {
    const diskPath = (f as Express.Multer.File & { path?: string }).path;
    if (diskPath && fs.existsSync(diskPath)) {
      paths.push(diskPath);
      continue;
    }
    if (f.buffer?.length) {
      const ext = path.extname(f.originalname) || ".jpg";
      const tmp = path.join(os.tmpdir(), `htt-${uuid()}${ext}`);
      fs.writeFileSync(tmp, f.buffer);
      paths.push(tmp);
      toUnlink.push(tmp);
    }
  }

  return {
    paths,
    cleanup: () => {
      for (const p of toUnlink) {
        try {
          fs.unlinkSync(p);
        } catch {
          /* ignore */
        }
      }
    }
  };
}

/** Public URLs stored on the report / photos table. */
export async function persistReportPhotoUrls(files: Express.Multer.File[]): Promise<string[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (useMemoryUploads()) {
    if (token) {
      const { put } = await import("@vercel/blob");
      const urls: string[] = [];
      for (const f of files) {
        if (!f.buffer?.length) continue;
        const ext = path.extname(f.originalname) || ".jpg";
        const name = `reports/${uuid()}${ext}`;
        const blob = await put(name, f.buffer, {
          access: "public",
          token,
          contentType: f.mimetype || "image/jpeg"
        });
        urls.push(blob.url);
      }
      return urls;
    }
    if (process.env.VERCEL === "1") {
      throw new Error(
        "Serverless uploads require BLOB_READ_WRITE_TOKEN (Vercel Blob). " +
          "Create a Blob store in the Vercel dashboard and attach the token to this project."
      );
    }
    // Integrated local Next + memory: write to sibling backend/uploads (cwd = frontend/)
    const uploadRoot = path.resolve(process.cwd(), "..", "backend", "uploads");
    if (!fs.existsSync(uploadRoot)) {
      fs.mkdirSync(uploadRoot, { recursive: true });
    }
    const urls: string[] = [];
    for (const f of files) {
      if (!f.buffer?.length) continue;
      const ext = path.extname(f.originalname) || ".jpg";
      const fn = `${uuid()}${ext}`;
      fs.writeFileSync(path.join(uploadRoot, fn), f.buffer);
      urls.push(`/api/uploads/${fn}`);
    }
    return urls;
  }

  return files.map((f) => {
    const fn = f.filename;
    if (!fn) throw new Error("Expected filename for disk-backed upload");
    return `/api/uploads/${fn}`;
  });
}
