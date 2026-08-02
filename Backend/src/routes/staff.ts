import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { Env } from "../types.js";
import { newId, nowIso, adminUserFromRow, safeJsonParse, type AdminUserRow } from "../db.js";
import { adminAuthMiddleware, requireAdmin, requireSuperAdmin } from "../middleware/auth.js";
import { logActivity } from "../lib/logger.js";

const staff = new Hono<{ Bindings: Env }>();

staff.use("/*", adminAuthMiddleware);

const VALID_ROLES = ["super_admin", "admin", "editor"];

// ── GET /api/admin/staff — list all admin users ──────────────────────────────
staff.get("/", requireAdmin, async (c) => {
  const { results } = await c.env.DB
    .prepare("SELECT * FROM admin_users ORDER BY created_at ASC")
    .all<AdminUserRow>();

  return c.json({
    staff: results.map((r) => adminUserFromRow(r)),
  });
});

// ── POST /api/admin/staff — create a new admin user ──────────────────────────
// super_admin can create any role; admin can only create editor
staff.post("/", requireAdmin, async (c) => {
  const db = c.env.DB;
  const caller = c.get("user");
  const body = await c.req.json();

  if (!body.email || !body.name || !body.password || !body.role) {
    return c.json({ error: "email, name, password, role are required" }, 400);
  }

  if (!VALID_ROLES.includes(body.role)) {
    return c.json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` }, 400);
  }

  if (body.password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }

  // admin can only create editors, not other admins
  if (caller.role === "admin" && body.role !== "editor") {
    return c.json({ error: "Admins can only create editor accounts" }, 403);
  }

  const emailNormalized = body.email.toLowerCase().trim();
  const existing = await db
    .prepare("SELECT id FROM admin_users WHERE email = ? LIMIT 1")
    .bind(emailNormalized).first<{ id: string }>();

  if (existing) {
    return c.json({ error: "An admin user with this email already exists" }, 409);
  }

  const permissions = body.role === "editor" ? (body.permissions ?? {}) : {};
  const id = newId();
  const now = nowIso();
  const passwordHash = await bcrypt.hash(body.password, 12);

  await db
    .prepare(
      "INSERT INTO admin_users (id, email, password_hash, name, role, permissions, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, emailNormalized, passwordHash, body.name.trim(), body.role, JSON.stringify(permissions), caller.id, now, now)
    .run();

  await logActivity(db, caller.email, "Staff created", `${body.name} (${body.role})`);

  const row = await db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").bind(id).first<AdminUserRow>();
  return c.json({ admin: adminUserFromRow(row) }, 201);
});

// ── PUT /api/admin/staff/:id — update role / permissions / name ───────────────
// Only super_admin can change roles; admin can update editor permissions
staff.put("/:id", requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const caller = c.get("user");
  const body = await c.req.json();

  const row = await db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").bind(id).first<AdminUserRow>();
  if (!row) return c.json({ error: "Not found" }, 404);

  // Admins may only manage editor accounts; super_admins may manage anyone
  if (caller.role === "admin" && row.role !== "editor") {
    return c.json({ error: "Admins can only manage editor accounts" }, 403);
  }

  // Role changes are super_admin only
  if (body.role && body.role !== row.role && caller.role !== "super_admin") {
    return c.json({ error: "Only super_admin can change roles" }, 403);
  }

  if (body.role && !VALID_ROLES.includes(body.role)) {
    return c.json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` }, 400);
  }

  // Email change — normalise and enforce uniqueness
  let newEmail = row.email;
  if (body.email && body.email.toLowerCase().trim() !== row.email) {
    newEmail = body.email.toLowerCase().trim();
    const dupe = await db
      .prepare("SELECT id FROM admin_users WHERE email = ? AND id != ? LIMIT 1")
      .bind(newEmail, id).first<{ id: string }>();
    if (dupe) return c.json({ error: "An admin user with this email already exists" }, 409);
  }

  // Cannot demote the only super_admin
  if (row.role === "super_admin" && body.role && body.role !== "super_admin") {
    const { results } = await db
      .prepare("SELECT COUNT(*) as n FROM admin_users WHERE role = 'super_admin'")
      .all<{ n: number }>();
    if ((results[0] as any).n <= 1) {
      return c.json({ error: "Cannot demote the only super_admin" }, 400);
    }
  }

  const newRole = body.role ?? row.role;
  const newPermissions = newRole === "editor"
    ? JSON.stringify(body.permissions ?? safeJsonParse(row.permissions, {}))
    : "{}";

  await db
    .prepare("UPDATE admin_users SET name = ?, email = ?, role = ?, permissions = ?, updated_at = ? WHERE id = ?")
    .bind(body.name ?? row.name, newEmail, newRole, newPermissions, nowIso(), id)
    .run();

  await logActivity(db, caller.email, "Staff updated", `${newEmail} → ${newRole}`);

  const updated = await db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").bind(id).first<AdminUserRow>();
  return c.json({ admin: adminUserFromRow(updated) });
});

// ── PUT /api/admin/staff/:id/password — reset a staff member's password ──────
// super_admin can reset anyone; admin can reset editors only
staff.put("/:id/password", requireAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const caller = c.get("user");
  const { password } = await c.req.json();

  if (!password || password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400);
  }

  const row = await db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").bind(id).first<AdminUserRow>();
  if (!row) return c.json({ error: "Not found" }, 404);

  if (caller.role === "admin" && row.role !== "editor") {
    return c.json({ error: "Admins can only reset editor passwords" }, 403);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .prepare("UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .bind(passwordHash, nowIso(), id)
    .run();

  await logActivity(db, caller.email, "Password reset", row.email);
  return c.json({ success: true });
});

// ── DELETE /api/admin/staff/:id — super_admin only ───────────────────────────
staff.delete("/:id", requireSuperAdmin, async (c) => {
  const { id } = c.req.param();
  const db = c.env.DB;
  const caller = c.get("user");

  if (id === caller.id) return c.json({ error: "Cannot delete your own account" }, 400);

  const row = await db.prepare("SELECT * FROM admin_users WHERE id = ? LIMIT 1").bind(id).first<AdminUserRow>();
  if (!row) return c.json({ error: "Not found" }, 404);

  if (row.role === "super_admin") {
    const { results } = await db
      .prepare("SELECT COUNT(*) as n FROM admin_users WHERE role = 'super_admin'")
      .all<{ n: number }>();
    if ((results[0] as any).n <= 1) {
      return c.json({ error: "Cannot delete the only super_admin" }, 400);
    }
  }

  await db.prepare("DELETE FROM admin_users WHERE id = ?").bind(id).run();
  await logActivity(db, caller.email, "Staff deleted", row.email);
  return c.json({ success: true });
});

export default staff;
