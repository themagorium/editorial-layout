const ADMIN_AUTH_SESSION_KEY = "magorium-admin-auth";

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
  sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
}
