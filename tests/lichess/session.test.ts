import { afterEach, describe, expect, it } from "vitest";
import { openAccessToken, pkceChallenge, sealAccessToken } from "../../lib/lichess/session";

const previousSecret = process.env.LICHESS_SESSION_SECRET;

afterEach(() => {
  if (previousSecret === undefined) delete process.env.LICHESS_SESSION_SECRET;
  else process.env.LICHESS_SESSION_SECRET = previousSecret;
});

describe("Lichess OAuth session", () => {
  it("creates the RFC 7636 S256 challenge", async () => {
    expect(await pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))
      .toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("encrypts the access token and rejects tampering", async () => {
    process.env.LICHESS_SESSION_SECRET = "test-secret-that-is-definitely-more-than-32-characters";
    const sealed = await sealAccessToken("lip_example_token");
    expect(sealed).not.toContain("lip_example_token");
    expect(await openAccessToken(sealed)).toBe("lip_example_token");
    const [iv, ciphertext] = sealed.split(".");
    const tampered = `${iv}.${ciphertext[0] === "A" ? "B" : "A"}${ciphertext.slice(1)}`;
    expect(await openAccessToken(tampered)).toBeNull();
  });
});
