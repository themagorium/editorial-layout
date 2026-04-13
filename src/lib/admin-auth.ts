const ADMIN_AUTH_SESSION_KEY = "magorium-admin-auth";
const ADMIN_AUTH_TOKEN_KEY = "magorium-admin-token";

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === "true";
}

export function setAdminAuthenticated(isAuthenticated: boolean): void {
  if (isAuthenticated) {
    sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, "true");
    return;
  }

  sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
}

export function getAdminPublishToken(): string | null {
  const token = sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY)?.trim();
  return token ? token : null;
}

export function setAdminPublishToken(token: string): void {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    return;
  }

  sessionStorage.setItem(ADMIN_AUTH_TOKEN_KEY, normalizedToken);
}

export function resetAdminPasswordAccess(): void {
  sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
}
