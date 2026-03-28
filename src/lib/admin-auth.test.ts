import { beforeEach, describe, expect, it } from "vitest";
import {
  isAdminAuthenticated,
  resetAdminPasswordAccess,
  setAdminAuthenticated,
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
    expect(isAdminAuthenticated()).toBe(true);
    resetAdminPasswordAccess();
    expect(isAdminAuthenticated()).toBe(false);
  });
});
