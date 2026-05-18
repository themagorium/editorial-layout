import type { VercelRequest } from "@vercel/node";

const DEFAULT_TRUSTED_HOSTS = new Set([
  "themagorium.com",
  "www.themagorium.com",
  "themagorium.co",
  "www.themagorium.co",
  "maximillianco.com",
  "www.maximillianco.com",
  "localhost",
  "127.0.0.1",
]);

const DEFAULT_TRUSTED_SUFFIXES = [".vercel.app", ".vercel.sh", ".now.sh"];

function splitCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeHost(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  const hostLike = trimmed
    .split("/")[0]
    .split("?")[0]
    .replace(/^\[|\]$/g, "");

  const withoutPort = hostLike.includes(":") ? hostLike.split(":")[0] : hostLike;
  return withoutPort.replace(/\.$/, "");
}

function collectHeaderHosts(value: string | string[] | undefined, asUrl = false): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const hosts: string[] = [];

  values.forEach((entry) => {
    entry
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const normalized = normalizeHost(asUrl ? part : part);
        if (normalized) hosts.push(normalized);
      });
  });

  return hosts;
}

function getRequestHostCandidates(req: VercelRequest) {
  const headers = req.headers || {};
  const sourceHosts = new Set<string>();
  const destinationHosts = new Set<string>();

  collectHeaderHosts(headers.origin, true).forEach((host) => sourceHosts.add(host));
  collectHeaderHosts(headers.referer, true).forEach((host) => sourceHosts.add(host));
  collectHeaderHosts(headers.host).forEach((host) => destinationHosts.add(host));
  collectHeaderHosts(headers["x-forwarded-host"]).forEach((host) => destinationHosts.add(host));

  return {
    sourceHosts: Array.from(sourceHosts),
    destinationHosts: Array.from(destinationHosts),
  };
}

function getTrustedHosts() {
  const trustedHosts = new Set(DEFAULT_TRUSTED_HOSTS);
  splitCsv(process.env.ADMIN_TRUSTED_HOSTS).forEach((host) => trustedHosts.add(host));
  return trustedHosts;
}

function getTrustedSuffixes() {
  return Array.from(new Set([...DEFAULT_TRUSTED_SUFFIXES, ...splitCsv(process.env.ADMIN_TRUSTED_HOST_SUFFIXES)]));
}

function isHostTrusted(host: string, trustedHosts: Set<string>, trustedSuffixes: string[]) {
  if (trustedHosts.has(host)) return true;
  return trustedSuffixes.some((suffix) => host.length > suffix.length && host.endsWith(suffix));
}

export function isTrustedAdminRequest(req: VercelRequest): boolean {
  if (process.env.ADMIN_TRUST_ALL_ORIGINS === "1") return true;

  const { sourceHosts, destinationHosts } = getRequestHostCandidates(req);
  if (sourceHosts.length === 0 && destinationHosts.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const trustedHosts = getTrustedHosts();
  const trustedSuffixes = getTrustedSuffixes();

  if (sourceHosts.length > 0) {
    return sourceHosts.some((host) => isHostTrusted(host, trustedHosts, trustedSuffixes));
  }

  return destinationHosts.some((host) => isHostTrusted(host, trustedHosts, trustedSuffixes));
}
