import { beforeEach, describe, expect, it } from "vitest";
import {
  isAdminAuthenticated,
  resetAdminPasswordAccess,
  setAdminAuthenticated,
  setAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-auth";

describe("admin auth access reset", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("accepts the default password by default", () => {
    expect(verifyAdminPassword("Magorium2025")).toBe(true);
    expect(verifyAdminPassword("wrong-password")).toBe(false);
  });

  it("allows setting a new password and clears active session", () => {
    setAdminAuthenticated(true);
    expect(isAdminAuthenticated()).toBe(true);

    setAdminPassword("new-secure-pass");

    expect(isAdminAuthenticated()).toBe(false);
    expect(verifyAdminPassword("new-secure-pass")).toBe(true);
    expect(verifyAdminPassword("Magorium2025")).toBe(false);
  });

  it("resets stored password and active admin session", () => {
    localStorage.setItem("magorium-admin-password", "temporary-password");
    setAdminAuthenticated(true);
    expect(isAdminAuthenticated()).toBe(true);
    expect(verifyAdminPassword("temporary-password")).toBe(true);

    resetAdminPasswordAccess();

    expect(isAdminAuthenticated()).toBe(false);
    expect(verifyAdminPassword("temporary-password")).toBe(false);
    expect(verifyAdminPassword("Magorium2025")).toBe(true);
  });
});
