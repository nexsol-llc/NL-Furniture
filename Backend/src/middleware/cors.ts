import { Context, Next } from "hono";
import { Env } from "../types.js";

// TODO: replace the production origins once the real domain is decided.
const ALLOWED_ORIGINS = [
  "https://www.nl-furniture.nl",
  "https://nl-furniture.nl",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://nl-furniture.vercel.app"
];

export async function corsMiddleware(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const requestOrigin = c.req.header("Origin") || "";
  const configuredOrigin = c.env.CORS_ORIGIN || "";

  const allowed =
    ALLOWED_ORIGINS.includes(requestOrigin) ||
    requestOrigin === configuredOrigin;

  const allowOrigin = allowed ? requestOrigin : ALLOWED_ORIGINS[0];

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Visitor-Id",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  await next();
  c.res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
