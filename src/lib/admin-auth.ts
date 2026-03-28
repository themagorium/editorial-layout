export const DEFAULT_ADMIN_PASSWORD = "Happiness2025";
const ADMIN_AUTH_SESSION_KEY = "magorium-admin-auth";
const ADMIN_PASSWORD_STORAGE_KEY = "magorium-admin-password";
const LEGACY_DEFAULT_PASSWORDS = ["Happiness2026", "Happiness2026!", "Happiness2025!", "Magorium2025"];

function isKnownDefaultPassword(input: string): boolean {
  const normalizedInput = input.replace(/\s+/g, "").toLowerCase();
  const knownDefaults = [DEFAULT_ADMIN_PASSWORD, ...LEGACY_DEFAULT_PASSWORDS].map((password) =>
    password.replace(/\s+/g, "").toLowerCase(),
  );
  return knownDefaults.includes(normalizedInput);
}

export function getAdminPassword(): string {
  return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY)?.trim() || DEFAULT_ADMIN_PASSWORD;
}

export function verifyAdminPassword(input: string): boolean {
  const normalizedInput = input.trim();
  if (!normalizedInput) {
    return false;
  }

  if (isKnownDefaultPassword(normalizedInput)) {
    return true;
  }

  return normalizedInput === getAdminPassword();
}

export function setAdminPassword(newPassword: string): void {
  const normalizedPassword = newPassword.trim();
  if (!normalizedPassword) {
    localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    return;
  }

  localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, normalizedPassword);
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
