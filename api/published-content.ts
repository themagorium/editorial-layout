import type { VercelRequest, VercelResponse } from "@vercel/node";
import contentHandler from "./content.js";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return contentHandler(req, res);
}
