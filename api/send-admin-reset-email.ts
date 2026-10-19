import type { VercelRequest, VercelResponse } from "@vercel/node";

// Disabled. Nothing on the site called this endpoint, and it accepted any
// recipient and any link without authentication, so anyone could use it to
// send email from the Magorium address (an open relay). It also could not
// reset anything: the admin password is the ADMIN_PASSWORD setting in Vercel.
// A proper emailed reset flow needs a signed one-time link sent only to the
// owner's address, plus a stored password that can be changed in-app.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(410).json({
    error: "Password reset email is not available. Change ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy.",
  });
}
