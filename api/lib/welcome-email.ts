// The welcome email sent to every new email subscriber.
// Georgia for the masthead and headline, Calibri 11pt for the text, in the
// website's indigo (#262065) and gold (#DBB870). Approved by Millie, Nov 2026.

export const WELCOME_SUBJECT = "Welcome to The Magorium";

export function welcomeHtml(unsubscribeUrl: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Welcome to The Magorium</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ee;">
  <!-- Preview text shown in the inbox list -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Thank you for subscribing. You’ll hear from us once a month, when each new edition goes live.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f2ee;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;">

          <!-- Masthead -->
          <tr>
            <td align="center" style="background:#262065;padding:16px 24px 13px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:18pt;line-height:1.1;letter-spacing:2px;font-weight:normal;">
                <span style="color:#ffffff;">THE </span><span style="color:#dbb870;">MAGORIUM</span>
              </div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:6.5pt;letter-spacing:3px;color:#dbb870;padding-top:5px;">WHERE CURATED BECOMES LEGEND</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 8px;font-family:Calibri,Helvetica,Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1f1d2b;">
              <p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:17pt;line-height:1.3;color:#262065;font-weight:normal;">Thank you for subscribing to The Magorium.</p>

              <p style="margin:0 0 16px;">The Magorium is an editorial publication on the world's most remarkable events and the culture around them, from art fairs and fashion weeks to Formula&nbsp;1, sailing, equestrian sport and travel, and the ideas shaping global finance and technology.</p>

              <p style="margin:0 0 16px;">Each month we publish a new edition: three feature stories and four Editor's Picks, chosen, researched and fact-checked with care.</p>

              <p style="margin:0 0 26px;">You'll hear from us once a month, when the new edition goes live. No daily emails, no clutter.</p>

              <!-- Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 30px;">
                <tr>
                  <td style="background:#262065;border-radius:3px;">
                    <a href="https://www.themagorium.com/" style="display:inline-block;padding:13px 28px;font-family:Calibri,Helvetica,Arial,sans-serif;font-size:11pt;color:#dbb870;text-decoration:none;letter-spacing:1px;">Read the current edition</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 22px;">With warm regards,</p>
              <p style="margin:0;font-weight:bold;color:#262065;">Millie Sealana</p>
              <p style="margin:0;">Editor-in-Chief</p>
              <p style="margin:0 0 32px;white-space:nowrap;">The&nbsp;Magorium</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 30px;border-top:1px solid #e6e2da;font-family:Calibri,Helvetica,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#8a847a;">
              <p style="margin:0 0 8px;">You're receiving this email because you subscribed at <a href="https://www.themagorium.com/" style="color:#8a847a;">themagorium.com</a>.</p>
              <p style="margin:0;white-space:nowrap;">The&nbsp;Magorium</p>
              <p style="margin:0 0 8px;white-space:nowrap;">San&nbsp;Francisco&nbsp;·&nbsp;New&nbsp;York&nbsp;·&nbsp;Zürich</p>
              <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#262065;text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function welcomeText(unsubscribeUrl: string): string {
  return [
    "Thank you for subscribing to The Magorium.",
    "",
    "The Magorium is an editorial publication on the world's most remarkable events and the culture around them, from art fairs and fashion weeks to Formula 1, sailing, equestrian sport and travel, and the ideas shaping global finance and technology.",
    "",
    "Each month we publish a new edition: three feature stories and four Editor's Picks, chosen, researched and fact-checked with care.",
    "",
    "You'll hear from us once a month, when the new edition goes live. No daily emails, no clutter.",
    "",
    "Read the current edition: https://www.themagorium.com/",
    "",
    "With warm regards,",
    "",
    "Millie Sealana",
    "Editor-in-Chief",
    "The Magorium",
    "",
    "--",
    "You're receiving this email because you subscribed at themagorium.com.",
    "The Magorium",
    "San Francisco · New York · Zürich",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}
