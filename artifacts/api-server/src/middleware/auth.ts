import { Request, Response, NextFunction } from "express";

/**
 * Bearer token authentication middleware.
 *
 * Reads the expected token from API_ACCESS_KEY env var and checks it against
 * the Authorization header.
 *
 * Exempt paths (always public):
 *  - GET  /healthz  — deployment health checks
 *  - POST /chat     — public landing-page chatbot
 */

const PUBLIC_PATHS = new Set(["/healthz"]);
const PUBLIC_POST_PATHS = new Set(["/chat"]);

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Exempt public routes
  if (
    PUBLIC_PATHS.has(req.path) ||
    (req.method === "POST" && PUBLIC_POST_PATHS.has(req.path))
  ) {
    next();
    return;
  }

  const expectedToken = process.env.API_ACCESS_KEY;

  // If no API key is configured (local dev without env var) — allow all
  if (!expectedToken) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: missing Bearer token" });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== expectedToken) {
    res.status(401).json({ error: "Unauthorized: invalid token" });
    return;
  }

  next();
}
