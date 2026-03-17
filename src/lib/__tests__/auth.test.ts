// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify, SignJWT } from "jose";

const SECRET = new TextEncoder().encode("development-secret-key");

async function mintToken(
  payload: Record<string, unknown>,
  expiresIn = "7d"
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(SECRET);
}

const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ set: mockSet, get: mockGet, delete: mockDelete })
  ),
}));

const { createSession, getSession } = await import("@/lib/auth");

beforeEach(() => {
  vi.clearAllMocks();
});

test("sets an httpOnly cookie named auth-token", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [name, , options] = mockSet.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
  expect(options.path).toBe("/");
  expect(options.sameSite).toBe("lax");
});

test("cookie expires in approximately 7 days", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const [, , options] = mockSet.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("issues a JWT containing userId and email", async () => {
  await createSession("user-42", "alice@example.com");

  const [, token] = mockSet.mock.calls[0];
  const { payload } = await jwtVerify(token, SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("alice@example.com");
});

test("JWT expires in 7 days", async () => {
  const before = Math.floor(Date.now() / 1000);
  await createSession("user-1", "test@example.com");

  const [, token] = mockSet.mock.calls[0];
  const { payload } = await jwtVerify(token, SECRET);

  const sevenDaysSec = 7 * 24 * 60 * 60;
  expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDaysSec - 5);
  expect(payload.exp).toBeLessThanOrEqual(before + sevenDaysSec + 5);
});

// --- getSession ---

test("getSession returns null when no cookie is present", async () => {
  mockGet.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for a malformed token", async () => {
  mockGet.mockReturnValue({ value: "not.a.valid.jwt" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const token = await mintToken(
    { userId: "user-1", email: "test@example.com" },
    "-1s"
  );
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns userId and email from a valid token", async () => {
  const token = await mintToken({ userId: "user-7", email: "bob@example.com" });
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session?.userId).toBe("user-7");
  expect(session?.email).toBe("bob@example.com");
});

test("getSession returns null for a token signed with the wrong secret", async () => {
  const wrongSecret = new TextEncoder().encode("wrong-secret");
  const token = await new SignJWT({ userId: "user-1", email: "x@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(wrongSecret);
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});
