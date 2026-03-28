import { describe, expect, it } from "vitest";
import handler from "../../api/admin-login";

describe("admin-login API", () => {
  it("authenticates using ADMIN_PASSWORD env var", async () => {
    const previous = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "secret";

    const req = {
      method: "POST",
      body: { password: "secret" },
    } as unknown as Parameters<typeof handler>[0];

    let statusCode = 0;
    let jsonBody: unknown = null;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: unknown) {
        jsonBody = body;
        return this;
      },
    } as unknown as Parameters<typeof handler>[1];

    await handler(req, res);
    expect(statusCode).toBe(200);
    expect(jsonBody).toEqual({ success: true });

    if (previous === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previous;
    }
  });
});
