/** Common camera / export extensions when the browser sends an empty or generic MIME type. */
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?)$/i;

/**
 * Accept uploads where `mimetype` is missing or `application/octet-stream` (common on Windows)
 * if the filename looks like a known image extension.
 */
export function isAllowedReportImage(file: { mimetype?: string; originalname?: string }): boolean {
  const m = (file.mimetype || "").toLowerCase();
  if (m.startsWith("image/")) return true;
  const name = file.originalname || "";
  if (
    m === "application/octet-stream" ||
    m === "binary/octet-stream" ||
    m === "" ||
    m === "application/x-msdownload"
  ) {
    return IMAGE_EXT.test(name);
  }
  return false;
}
