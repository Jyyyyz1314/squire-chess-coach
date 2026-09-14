import { describe, expect, it } from "vitest";
import { CoachCredentials, normalizeCoachEndpoint } from "../../lib/coach/config";

describe("per-user coach configuration", () => {
  it("normalizes an OpenAI-compatible public HTTPS endpoint", () => {
    expect(normalizeCoachEndpoint("https://api.example.com/v1").toString()).toBe("https://api.example.com/v1/chat/completions");
    expect(normalizeCoachEndpoint("https://api.example.com/v1/chat/completions").toString()).toBe("https://api.example.com/v1/chat/completions");
  });

  it.each([
    "http://api.example.com/v1",
    "https://localhost/v1",
    "https://127.0.0.1/v1",
    "https://10.0.0.2/v1",
    "https://192.168.1.2/v1",
    "https://[::1]/v1",
  ])("rejects an unsafe endpoint: %s", (url) => {
    expect(() => normalizeCoachEndpoint(url)).toThrow();
  });

  it("requires a complete user-owned credential set", () => {
    expect(CoachCredentials.safeParse({ baseUrl: "https://api.example.com/v1", apiKey: "sk-example", model: "model-name" }).success).toBe(true);
    expect(CoachCredentials.safeParse({ baseUrl: "https://api.example.com/v1", apiKey: "", model: "model-name" }).success).toBe(false);
  });
});
