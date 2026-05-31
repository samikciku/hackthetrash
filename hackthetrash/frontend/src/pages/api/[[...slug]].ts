import type { NextApiRequest, NextApiResponse } from "next";
import serverless from "serverless-http";
import { createApp } from "../../../../backend/src/app";

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
  return getHandler()(req, res);
}
