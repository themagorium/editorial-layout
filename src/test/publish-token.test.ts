import { describe, expect, it } from "vitest";
import { createPublishToken, verifyPublishToken } from "../../api/lib/publish-token";

describe("publish token", () => {
  it("creates and verifies signed token", () => {
    const { token } = createPublishToken("secret");
    expect(verifyPublishToken(token, "secret")).toBe(true);
  });

  it("rejects token for wrong secret", () => {
    const { token } = createPublishToken("secret");
    expect(verifyPublishToken(token, "other-secret")).toBe(false);
  });
});
