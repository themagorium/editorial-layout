const DEFAULT_ADMIN_PASSWORD = "Happiness2026";
const ADMIN_AUTH_SESSION_KEY = "magorium-admin-auth";
const ADMIN_PASSWORD_STORAGE_KEY = "magorium-admin-password";

export function getAdminPassword(): string {
  return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function verifyAdminPassword(input: string): boolean {
  return input === getAdminPassword();
}

export function setAdminPassword(newPassword: string): void {
  localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, newPassword);
  sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === "true";
}

export function setAdminAuthenticated(isAuthenticated: boolean): void {
  if (isAuthenticated) {
    sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, "true");
    return;
  }

  sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
}

export function resetAdminPasswordAccess(): void {
  localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
}
