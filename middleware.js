const COOKIE_NAME = "personal_session";

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

function base64UrlToBytes(value) {
  const base64 =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(
        value.length + (4 - (value.length % 4)) % 4,
        "="
      );

  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function verifySession(token, secret) {

  if (!token || !secret) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [expires, signature] = parts;

  if (!/^\d+$/.test(expires)) {
    return false;
  }

  const expiration = Number(expires);

  if (
    !Number.isFinite(expiration) ||
    expiration < Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  try {

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

    const expectedBuffer =
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(expires)
      );

    const expected =
      new Uint8Array(expectedBuffer);

    const received =
      base64UrlToBytes(signature);

    if (expected.length !== received.length) {
      return false;
    }

    let difference = 0;

    for (let i = 0; i < expected.length; i++) {
      difference |= expected[i] ^ received[i];
    }

    return difference === 0;

  } catch (error) {

    return false;

  }
}

export default async function middleware(request) {

  const pathname =
    new URL(request.url).pathname;

  /*
   * PROTECT ONLY PERSONAL GALLERY
   */

  if (pathname !== "/personal.html") {
    return;
  }

  /*
   * SESSION SECRET
   */

  const secret =
    process.env.PERSONAL_SESSION_SECRET;

  /*
   * SESSION COOKIE
   */

  const token =
    getCookie(request, COOKIE_NAME);

  /*
   * VALIDATE SESSION
   */

  const valid =
    await verifySession(
      token,
      secret
    );

  /*
   * NO VALID SESSION
   * HIDE PAGE COMPLETELY
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
