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
    expect(verifyAdminPassword("Happiness2025")).toBe(true);
    expect(verifyAdminPassword("wrong-password")).toBe(false);
  });

  it("allows setting a new password and clears active session", () => {
    setAdminAuthenticated(true);
    expect(isAdminAuthenticated()).toBe(true);

    setAdminPassword("new-secure-pass");

    expect(isAdminAuthenticated()).toBe(false);
    expect(verifyAdminPassword("new-secure-pass")).toBe(true);
    expect(verifyAdminPassword("Happiness2025")).toBe(true);
  });

  it("resets stored password and active admin session", () => {
    localStorage.setItem("magorium-admin-password", "temporary-password");
    setAdminAuthenticated(true);
    expect(isAdminAuthenticated()).toBe(true);
    expect(verifyAdminPassword("temporary-password")).toBe(true);

    resetAdminPasswordAccess();

    expect(isAdminAuthenticated()).toBe(false);
    expect(verifyAdminPassword("temporary-password")).toBe(false);
    expect(verifyAdminPassword("Happiness2025")).toBe(true);
  });

  it("accepts default password even when a custom password exists", () => {
    setAdminPassword("custom-password");
    expect(verifyAdminPassword("custom-password")).toBe(true);
    expect(verifyAdminPassword("Happiness2025")).toBe(true);
  });
});
