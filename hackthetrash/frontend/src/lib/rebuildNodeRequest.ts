import http from "http";
import { PassThrough } from "stream";
import type { NextApiRequest } from "next";

const NO_BODY_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

export function methodMayHaveBody(method: string | undefined): boolean {
  return !NO_BODY_METHODS.has((method || "GET").toUpperCase());
}

/** Drain the Next/Vercel request stream into a single buffer (fixes empty stream + Content-Length mismatch). */
export async function readNextApiBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<string | Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Build a Node IncomingMessage whose readable side replays `body`.
 * Passing Next's req directly into serverless-http + express.json() on Vercel often yields
 * Content-Length > 0 but an already-drained stream → raw-body waits forever → 504.
 */
export function rebuildIncomingMessage(original: NextApiRequest, body: Buffer): http.IncomingMessage {
  const pt = new PassThrough();
  const incoming = new http.IncomingMessage(pt as any);

  incoming.url = original.url || "/";
  incoming.method = original.method;
  incoming.httpVersion = original.httpVersion || "1.1";
  incoming.httpVersionMajor = (original as { httpVersionMajor?: number }).httpVersionMajor ?? 1;
  incoming.httpVersionMinor = (original as { httpVersionMinor?: number }).httpVersionMinor ?? 1;

  const headers = { ...original.headers } as http.IncomingHttpHeaders;
  headers["content-length"] = String(body.length);
  delete headers["transfer-encoding"];
  incoming.headers = headers;

  if (body.length) pt.push(body);
  pt.push(null);

  return incoming;
}
