import type { NextApiRequest, NextApiResponse } from "next";
import serverless from "serverless-http";
import { createApp } from "../../../../backend/src/app";
import {
  methodMayHaveBody,
  readNextApiBody,
  rebuildIncomingMessage
} from "@/lib/rebuildNodeRequest";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

let handler: ReturnType<typeof serverless> | undefined;

function getHandler() {
  if (!handler) {
    handler = serverless(createApp());
  }
  return handler;
}

export default async function apiGateway(req: NextApiRequest, res: NextApiResponse) {
  // Vercel + Next can hand off a request whose body stream is empty while Content-Length
  // still reflects the client payload — express.raw-body then blocks until timeout (504).
  let upstream: NextApiRequest | ReturnType<typeof rebuildIncomingMessage> = req;
  if (methodMayHaveBody(req.method)) {
    const body = await readNextApiBody(req);
    const cl = Number(req.headers["content-length"]);
    if (body.length === 0 && Number.isFinite(cl) && cl > 0) {
      console.error(
        "[api-gateway] Request body was empty after read but Content-Length was",
        cl,
        "— check Vercel/Next body handling; login and multipart may fail."
      );
    }
    upstream = rebuildIncomingMessage(req, body);
  }

  return getHandler()(upstream as never, res as never);
}
