import crypto from "crypto";

const COOKIE_NAME = "personal_session";
const SESSION_SECONDS = 60 * 60 * 12; // 12 horas

function createSession(secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(String(expires))
    .digest("base64url");

  return `${expires}.${signature}`;
}

function verifySession(token, secret) {
  if (!token || !secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [expires, signature] = parts;

  if (!/^\d+$/.test(expires)) return false;

  const expiration = Number(expires);

  if (expiration < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(expires)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

function getCookie(req, name) {
  const header = req.headers.cookie || "";

  const cookies = header.split(";");

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

export default async function handler(req, res) {

  /*
   * =========================
   * CORS / METHOD
   * =========================
   */

  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  /*
   * =========================
   * ENVIRONMENT
   * =========================
   */

  const password = process.env.PERSONAL_GALLERY_PASSWORD;
  const sessionSecret = process.env.PERSONAL_SESSION_SECRET;

  if (!password || !sessionSecret) {
    return res.status(500).json({
      ok: false,
      error: "Private gallery authentication is not configured."
    });
  }

  /*
   * =========================
   * CHECK EXISTING SESSION
   * =========================
   */

  if (req.method === "GET") {

    const token = getCookie(req, COOKIE_NAME);

    const valid = verifySession(token, sessionSecret);

    return res.status(200).json({
      ok: valid
    });
  }

  /*
   * =========================
   * LOGIN
   * =========================
   */

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  const entered =
    typeof req.body === "object" && req.body !== null
      ? req.body.password
      : null;

  if (typeof entered !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Password required."
    });
  }

  /*
   * =========================
   * PASSWORD COMPARISON
   * =========================
   */

  const a = Buffer.from(entered);
  const b = Buffer.from(password);

  const passwordMatches =
    a.length === b.length &&
    crypto.timingSafeEqual(a, b);

  if (!passwordMatches) {
    return res.status(401).json({
      ok: false,
      error: "Invalid password."
    });
  }

  /*
   * =========================
   * CREATE SESSION
   * =========================
   */

  const session = createSession(sessionSecret);

  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview";

  const cookieParts = [
    `${COOKIE_NAME}=${encodeURIComponent(session)}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/api",
    `Max-Age=${SESSION_SECONDS}`
  ];

  if (isProduction) {
    cookieParts.push("Secure");
  }

  res.setHeader(
    "Set-Cookie",
    cookieParts.join("; ")
  );

  return res.status(200).json({
    ok: true
  });
}