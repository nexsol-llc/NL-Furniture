import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { Env, JwtPayload } from "../types.js";

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next): Promise<void | Response> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    c.set("user", payload as unknown as JwtPayload);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

// Requires a valid admin JWT (type = 'admin')
export async function adminAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next): Promise<void | Response> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const p = payload as unknown as JwtPayload;
    if (p.type !== "admin") {
      return c.json({ error: "Admin token required" }, 401);
    }
    c.set("user", p);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

export function requireRole(...roles: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}

// Any authenticated admin staff member
export const requireStaff = requireRole("super_admin", "admin", "editor");

// Admin or super_admin (content CRUD, delete operations)
export const requireAdmin = requireRole("super_admin", "admin");

// Super admin only (staff management, role changes)
export const requireSuperAdmin = requireRole("super_admin");

/**
 * Checks module-level permission.
 * - super_admin / admin → always allowed
 * - editor → only if their permissions[module] === true
 */
export function requirePermission(module: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get("user");
    if (!user || user.type !== "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }
    if (user.role === "super_admin" || user.role === "admin") {
      await next();
      return;
    }
    if (user.role === "editor" && user.permissions?.[module] === true) {
      await next();
      return;
    }
    return c.json({ error: "Forbidden: insufficient permissions" }, 403);
  };
}
