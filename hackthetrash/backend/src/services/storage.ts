// Placeholder for S3/Cloudinary integration.
// For MVP we use local disk via multer.

export const uploadToCloud = async (_file: Express.Multer.File): Promise<string> => {
  throw new Error("Not implemented — using local storage for MVP");
};
