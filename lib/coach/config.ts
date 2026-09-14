import { z } from "zod";

export const CoachCredentials = z.object({
  baseUrl: z.string().trim().url().max(300),
  apiKey: z.string().trim().min(8).max(500),
  model: z.string().trim().min(1).max(120),
});

export type CoachConfig = z.infer<typeof CoachCredentials>;

export const DEFAULT_COACH_CONFIG: CoachConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4.1-mini",
};

export function normalizeCoachEndpoint(baseUrl: string) {
  const endpoint = new URL(baseUrl);
  if (endpoint.protocol !== "https:") throw new Error("HTTPS_REQUIRED");
  if (endpoint.username || endpoint.password) throw new Error("UNSAFE_HOST");

  const hostname = endpoint.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const unsafeName = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal");
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)?.slice(1).map(Number);
  const unsafeIpv4 = Boolean(ipv4 && (ipv4.some((part) => part > 255) || ipv4[0] === 0 || ipv4[0] === 10 || ipv4[0] === 127 || (ipv4[0] === 169 && ipv4[1] === 254) || (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) || (ipv4[0] === 192 && ipv4[1] === 168)));
  const unsafeIpv6 = hostname === "::" || hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd") || /^fe[89ab]/.test(hostname);
  if (unsafeName || unsafeIpv4 || unsafeIpv6) throw new Error("UNSAFE_HOST");

  if (!/\/chat\/completions\/?$/.test(endpoint.pathname)) endpoint.pathname = `${endpoint.pathname.replace(/\/$/, "")}/chat/completions`;
  endpoint.search = "";
  endpoint.hash = "";
  return endpoint;
}
