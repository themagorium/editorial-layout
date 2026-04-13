import { beforeEach, describe, expect, it } from "vitest";
import {
  getAdminPublishToken,
  isAdminAuthenticated,
  resetAdminPasswordAccess,
  setAdminAuthenticated,
  setAdminPublishToken,
} from "@/lib/admin-auth";

describe("admin auth access reset", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("tracks admin authenticated session", () => {
    setAdminAuthenticated(true);
    expect(isAdminAuthenticated()).toBe(true);
  });

  it("resets active admin session", () => {
    setAdminAuthenticated(true);
    setAdminPublishToken("token-value");
    expect(isAdminAuthenticated()).toBe(true);
    expect(getAdminPublishToken()).toBe("token-value");
    resetAdminPasswordAccess();
    expect(isAdminAuthenticated()).toBe(false);
    expect(getAdminPublishToken()).toBeNull();
  });

  it("stores and trims publish token", () => {
    setAdminPublishToken("  secret-token  ");
    expect(getAdminPublishToken()).toBe("secret-token");

    setAdminPublishToken("   ");
    expect(getAdminPublishToken()).toBeNull();
  });
});
