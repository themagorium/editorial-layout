import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { filename, dataUrl } = req.body || {};
  if (!filename || !dataUrl || typeof dataUrl !== "string") {
    res.status(400).json({ error: "Missing filename or dataUrl" });
    return;
  }

  try {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: "Invalid data URL" });
      return;
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;

    const blob = await put(safeName, buffer, {
      access: "public",
      contentType,
    });

    res.status(200).json({ url: blob.url });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
  }
}
