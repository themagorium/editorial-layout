import { connect, type TLSSocket } from "node:tls";

// Minimal SMTP client (implicit TLS, AUTH LOGIN) for sending one plain-text +
// HTML message through the Magorium's own GoDaddy/cPanel mail server.
// Configured by SMTP_HOST, SMTP_PORT (default 465), SMTP_USER, SMTP_PASS.

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function encodeHeader(value: string): string {
  return /^[\x20-\x7E]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrapBase64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64").replace(/.{1,76}/g, "$&\r\n");
}

export async function sendSmtp(opts: { from: string; to: string; replyTo?: string; subject: string; text: string; html: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const host = process.env.SMTP_HOST as string;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER as string;
  const pass = process.env.SMTP_PASS as string;
  const fromAddress = (opts.from.match(/<([^>]+)>/)?.[1] || opts.from).trim();
  const boundary = `mag-${Date.now().toString(36)}`;
  const message = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    ...(opts.replyTo ? [`Reply-To: ${opts.replyTo}`] : []),
    `Subject: ${encodeHeader(opts.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@themagorium.com>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(opts.text),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapBase64(opts.html),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return new Promise((resolve) => {
    let socket: TLSSocket;
    let buffer = "";
    let step = 0;
    let settled = false;
    const finish = (result: { ok: true } | { ok: false; error: string }) => {
      if (settled) return;
      settled = true;
      try { socket.end(); } catch { /* closing */ }
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, error: "SMTP timed out." }), 15000);
    const send = (line: string) => socket.write(`${line}\r\n`);

    // Each step: the reply code we expect, then what to send next.
    const steps: { expect: number; next: () => void }[] = [
      { expect: 220, next: () => send("EHLO themagorium.com") },
      { expect: 250, next: () => send("AUTH LOGIN") },
      { expect: 334, next: () => send(Buffer.from(user).toString("base64")) },
      { expect: 334, next: () => send(Buffer.from(pass).toString("base64")) },
      { expect: 235, next: () => send(`MAIL FROM:<${fromAddress}>`) },
      { expect: 250, next: () => send(`RCPT TO:<${opts.to}>`) },
      { expect: 250, next: () => send("DATA") },
      { expect: 354, next: () => socket.write(`${message.replace(/^\./gm, "..")}\r\n.\r\n`) },
      { expect: 250, next: () => { send("QUIT"); clearTimeout(timer); finish({ ok: true }); } },
    ];

    socket = connect({ host, port, servername: host }, () => { /* wait for 220 */ });
    socket.setEncoding("utf8");
    socket.on("error", (err) => { clearTimeout(timer); finish({ ok: false, error: `SMTP: ${err.message}` }); });
    socket.on("data", (chunk: string) => {
      buffer += chunk;
      // A reply is complete when its last line is "NNN " (space, not dash).
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!/^\d{3} /.test(line)) continue;
        const code = Number(line.slice(0, 3));
        const current = steps[step];
        if (!current) return;
        if (code !== current.expect) {
          clearTimeout(timer);
          finish({ ok: false, error: `SMTP ${code}: ${line.slice(4, 200)}${step === 4 ? " (check SMTP_USER / SMTP_PASS)" : ""}` });
          return;
        }
        step += 1;
        current.next();
      }
    });
  });
}
