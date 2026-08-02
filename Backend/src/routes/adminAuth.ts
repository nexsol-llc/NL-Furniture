import { Hono } from "hono";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { Env, JwtPayload } from "../types.js";
import { newId, nowIso, adminUserFromRow, safeJsonParse, type AdminUserRow } from "../db.js";
import { adminAuthMiddleware } from "../middleware/auth.js";

const adminAuth = new Hono<{ Bindings: Env }>();

function makeToken(env: Env, row: AdminUserRow): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return new SignJWT({
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    type: "admin",
    permissions: safeJsonParse<Record<string, boolean>>(row.permissions, {}),
  } satisfies JwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

// ── POST /api/auth/admin/bootstrap ───────────────────────────────────────────
// One-time endpoint. Creates the first super_admin using JWT_SECRET as proof.
// Body: { secret, email, name, password }
adminAuth.post("/bootstrap", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  if (!body.secret || !body.email || !body.name || !body.password) {
    return c.json({ error: "secret, email, name, password are required" }, 400);
  }

  if (body.secret !== c.env.JWT_SECRET) {
    return c.json({ error: "Invalid secret" }, 403);
  }

  if (body.password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }

  // Only allowed when no super_admin exists yet
  const existing = await db
    .prepare("SELECT id FROM admin_users WHERE role = 'super_admin' LIMIT 1")
    .first<{ id: string }>();

  if (existing) {
    return c.json({ error: "Super admin already exists" }, 409);
  }

  const id = newId();
  const now = nowIso();
  const passwordHash = await bcrypt.hash(body.password, 12);

  await db
    .prepare(
      "INSERT INTO admin_users (id, email, password_hash, name, role, permissions, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, 'super_admin', '{}', NULL, ?, ?)"
    )
    .bind(id, body.email.toLowerCase().trim(), passwordHash, body.name.trim(), now, now)
    .run();

  const row = await db
    .prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1")
    .bind(id).first<AdminUserRow>();

  const token = await makeToken(c.env, row!);
  return c.json({ token, admin: adminUserFromRow(row) }, 201);
});

// ── POST /api/auth/admin/login ───────────────────────────────────────────────
adminAuth.post("/login", async (c) => {
  const db = c.env.DB;
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: "E-Mail and password are required" }, 400);
  }

  const row = await db
    .prepare("SELECT * FROM admin_users WHERE email = ? LIMIT 1")
    .bind(email.toLowerCase().trim()).first<AdminUserRow>();

  if (!row) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await makeToken(c.env, row);
  return c.json({ token, admin: adminUserFromRow(row) });
});

// ── GET /api/auth/admin/me ───────────────────────────────────────────────────
adminAuth.get("/me", adminAuthMiddleware, async (c) => {
  const jwtUser = c.get("user");
  const row = await c.env.DB
    .prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1")
    .bind(jwtUser.id).first<AdminUserRow>();

  if (!row) return c.json({ error: "Admin not found" }, 404);
  return c.json({ admin: adminUserFromRow(row) });
});

// ── PUT /api/auth/admin/change-password ──────────────────────────────────────
adminAuth.put("/change-password", adminAuthMiddleware, async (c) => {
  const db = c.env.DB;
  const jwtUser = c.get("user");
  const { currentPassword, newPassword } = await c.req.json();

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return c.json({ error: "currentPassword and newPassword (min 8 chars) required" }, 400);
  }

  const row = await db
    .prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1")
    .bind(jwtUser.id).first<AdminUserRow>();

  if (!row) return c.json({ error: "Not found" }, 404);

  const valid = await bcrypt.compare(currentPassword, row.password_hash);
  if (!valid) return c.json({ error: "Current password is incorrect" }, 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .prepare("UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .bind(passwordHash, nowIso(), row.id)
    .run();

  return c.json({ success: true });
});

export default adminAuth;
