import crypto from "crypto";

const COOKIE_NAME = "personal_session";
const SESSION_SECONDS = 60 * 60 * 12;

function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";

  const cookies = header.split(";");

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
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

export default function middleware(request) {

  const pathname =
    new URL(request.url).pathname;

  /*
   * PROTECT ONLY PERSONAL GALLERY
   */

  if (pathname !== "/personal.html") {
    return;
  }

  const secret =
    process.env.PERSONAL_SESSION_SECRET;

  const token =
    getCookie(request, COOKIE_NAME);

  const valid =
    verifySession(token, secret);

  /*
   * NO SESSION = HIDE PAGE COMPLETELY
   */

  if (!valid) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store"
      }
    });
  }

  /*
   * VALID SESSION
   */

  return;
}

export const config = {
  matcher: [
    "/personal.html"
  ]
};
