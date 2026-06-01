import http from "http";
import net from "net";
import type { NextApiRequest } from "next";

const NO_BODY_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

/** Max time to wait for the raw request body (large multipart reports on slow networks). */
const BODY_READ_TIMEOUT_MS = Math.min(
  240_000,
  Math.max(5_000, Number(process.env.HTT_API_BODY_READ_TIMEOUT_MS || 120_000))
);

export function methodMayHaveBody(method: string | undefined): boolean {
  return !NO_BODY_METHODS.has((method || "GET").toUpperCase());
}

/**
 * Drain the Next/Vercel request into a buffer. Uses classic stream events + resume()
 * because `for await` can yield nothing when the stream is paused or wrapped oddly.
 */
export async function readNextApiBody(req: NextApiRequest): Promise<Buffer> {
  const anyReq = req as unknown as { body?: unknown };
  const ct = String(req.headers["content-type"] || "").toLowerCase();
  if (
    ct.includes("application/json") &&
    anyReq.body &&
    typeof anyReq.body === "object" &&
    !Buffer.isBuffer(anyReq.body) &&
    !(anyReq.body instanceof Uint8Array)
  ) {
    try {
      return Buffer.from(JSON.stringify(anyReq.body));
    } catch {
      /* fall through */
    }
  }

  if (Buffer.isBuffer(anyReq.body)) return anyReq.body;
  if (anyReq.body instanceof Uint8Array) return Buffer.from(anyReq.body);
  if (typeof anyReq.body === "string") return Buffer.from(anyReq.body);

  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    let settled = false;
    const finish = (buf: Buffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.removeListener("data", onData);
      req.removeListener("end", onEnd);
      req.removeListener("error", onError);
      resolve(buf);
    };

    const onData = (chunk: string | Buffer) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    };
    const onEnd = () => finish(Buffer.concat(chunks));
    const onError = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.removeListener("data", onData);
      req.removeListener("end", onEnd);
      req.removeListener("error", onError);
      reject(err);
    };

    const timer = setTimeout(() => {
      // Avoid hanging forever; return whatever we got (may be empty — caller still rebuilds).
      finish(Buffer.concat(chunks));
    }, BODY_READ_TIMEOUT_MS);

    req.on("data", onData);
    req.on("end", onEnd);
    req.on("error", onError);

    // Paused streams on some hosts never emit until resumed.
    if (typeof (req as any).resume === "function") {
      (req as any).resume();
    }
  });
}

/**
 * Build a Node IncomingMessage whose readable side replays `body`.
 * Uses a real `net.Socket` readable push (more reliable on Vercel than PassThrough for
 * `http.IncomingMessage`). Rebuilds headers so Content-Length matches the replayed bytes.
 */
export function rebuildIncomingMessage(original: NextApiRequest, body: Buffer): http.IncomingMessage {
  const socket = new net.Socket({ allowHalfOpen: true });
  const incoming = new http.IncomingMessage(socket as any);

  incoming.url = original.url || "/";
  incoming.method = original.method;
  incoming.httpVersion = original.httpVersion || "1.1";
  incoming.httpVersionMajor = (original as { httpVersionMajor?: number }).httpVersionMajor ?? 1;
  incoming.httpVersionMinor = (original as { httpVersionMinor?: number }).httpVersionMinor ?? 1;

  const headers: http.IncomingHttpHeaders = {};
  for (const [key, value] of Object.entries(original.headers)) {
    const lower = key.toLowerCase();
    if (lower === "content-length" || lower === "transfer-encoding") continue;
    if (value === undefined) continue;
    headers[key] = value;
  }
  headers["content-length"] = String(body.length);
  incoming.headers = headers;

  if (body.length) socket.push(body);
  socket.push(null);

  return incoming;
}
