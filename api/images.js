import crypto from "crypto";

const COOKIE_NAME = "personal_session";
const SESSION_SECONDS = 60 * 60 * 12; // 12 horas

const PRIVATE_FOLDERS = new Set([
  "ENEOE/Viaje",
  "ENEOE/Emilio"
]);

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
   * METHOD
   * =========================
   */

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  /*
   * =========================
   * FOLDER
   * =========================
   */

  const folder = req.query.folder;

  if (typeof folder !== "string" || !folder.trim()) {
    return res.status(400).json({
      error: "Folder required."
    });
  }

  /*
   * =========================
   * PRIVATE GALLERY
   * =========================
   */

  if (PRIVATE_FOLDERS.has(folder)) {

    const sessionSecret = process.env.PERSONAL_SESSION_SECRET;

    if (!sessionSecret) {
      return res.status(500).json({
        error: "Private gallery authentication is not configured."
      });
    }

    const token = getCookie(req, COOKIE_NAME);

    const valid = verifySession(
      token,
      sessionSecret
    );

    if (!valid) {
      return res.status(401).json({
        error: "Unauthorized."
      });
    }
  }

  /*
   * =========================
   * CLOUDINARY
   * =========================
   */

  try {

    const cloud = "du4pmuch7";

    const apiKey =
      process.env.CLOUDINARY_API_KEY;

    const apiSecret =
      process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error: "Cloudinary authentication is not configured."
      });
    }

    let allImages = [];
    let nextCursor = null;

    do {

      const url =
        `https://api.cloudinary.com/v1_1/${cloud}/resources/search`;

      const response = await fetch(url, {
        method: "POST",

        headers: {
          Authorization:
            "Basic " +
            Buffer
              .from(apiKey + ":" + apiSecret)
              .toString("base64"),

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          expression: `folder:${folder}`,

          max_results: 500,

          next_cursor:
            nextCursor
        })
      });

      const data =
        await response.json();

      if (!response.ok) {
        return res.status(500).json({
          error:
            data.error?.message ||
            "Cloudinary request failed."
        });
      }

      if (!data.resources) {
        return res.status(500).json(data);
      }

      allImages =
        allImages.concat(data.resources);

      nextCursor =
        data.next_cursor || null;

    } while (nextCursor);

    const images =
      allImages.map(
        (r) => r.public_id
      );

    return res.status(200).json(images);

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });
  }
}