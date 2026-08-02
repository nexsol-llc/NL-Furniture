import { Hono } from "hono";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { Env } from "../types.js";
import { newId, nowIso, userFromRow, type UserRow } from "../db.js";
import { sendEmail, passwordResetHtml } from "../lib/mail.js";
import { authMiddleware } from "../middleware/auth.js";

const auth = new Hono<{ Bindings: Env }>();

// ── POST /api/auth/login — frontend customer login ───────────────────────────
auth.post("/login", async (c) => {
  const db = c.env.DB;
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: "E-mailadres en wachtwoord zijn verplicht." }, 400);
  }

  const userRow = await db
    .prepare("SELECT * FROM users WHERE email = ? LIMIT 1")
    .bind(email.toLowerCase().trim())
    .first<UserRow>();

  if (!userRow || !userRow.password_hash) {
    return c.json({ error: "Ongeldige inloggegevens." }, 401);
  }

  const valid = await bcrypt.compare(password, userRow.password_hash);
  if (!valid) {
    return c.json({ error: "Ongeldige inloggegevens." }, 401);
  }

  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  const token = await new SignJWT({
    id: userRow.id,
    email: userRow.email,
    role: "user",
    name: userRow.username,
    type: "user",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);

  const user = userFromRow(userRow)!;
  const { passwordHash, resetToken, resetTokenExpiry, ...safeUser } = user;
  return c.json({ token, user: safeUser });
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
auth.post("/register", async (c) => {
  const db = c.env.DB;
  const { username, email, password } = await c.req.json();

  if (!username || !email || !password) {
    return c.json({ error: "Gebruikersnaam, e-mailadres en wachtwoord zijn verplicht." }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: "Het wachtwoord moet minimaal 6 tekens lang zijn." }, 400);
  }

  const emailNormalized = email.toLowerCase().trim();
  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1")
    .bind(emailNormalized, username)
    .first();

  if (existing) {
    return c.json(
      { error: "Ein Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits." },
      409
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = newId();
  const now = nowIso();

  await db
    .prepare(
      "INSERT INTO users (id, username, email, role, avatar_url, liked_products, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, username.trim(), emailNormalized, "user", "", "[]", passwordHash, now, now)
    .run();

  return c.json({ success: true, userId: id }, 201);
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
auth.post("/forgot-password", async (c) => {
  const db = c.env.DB;
  const { email } = await c.req.json();
  if (!email) return c.json({ error: "E-mailadres is verplicht." }, 400);

  const emailNormalized = email.toLowerCase().trim();
  const userRow = await db
    .prepare("SELECT * FROM users WHERE email = ? LIMIT 1")
    .bind(emailNormalized)
    .first<UserRow>();

  if (!userRow) {
    return c.json({ success: true, message: "Reset link sent if email exists." });
  }

  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  const token = Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  const expiry = new Date(Date.now() + 3_600_000).toISOString();

  await db
    .prepare("UPDATE users SET reset_token = ?, reset_token_expiry = ?, updated_at = ? WHERE id = ?")
    .bind(token, expiry, nowIso(), userRow.id)
    .run();

  const resetUrl = `${c.env.SITE_URL}/reset-password?token=${token}`;
  await sendEmail(
    { to: emailNormalized, subject: "NL Furniture: wachtwoord opnieuw instellen", html: passwordResetHtml(userRow.username, resetUrl) },
    { apiKey: c.env.RESEND_API_KEY, from: c.env.RESEND_FROM }
  );

  return c.json({ success: true, message: "Reset link sent successfully." });
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
auth.post("/reset-password", async (c) => {
  const db = c.env.DB;
  const { token, password } = await c.req.json();
  if (!token || !password || password.length < 6) {
    return c.json({ error: "Token en wachtwoord (minimaal 6 tekens) zijn verplicht." }, 400);
  }

  const userRow = await db
    .prepare("SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ? LIMIT 1")
    .bind(token, nowIso())
    .first<UserRow>();

  if (!userRow) return c.json({ error: "Ongeldige of verlopen token." }, 400);

  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = ? WHERE id = ?")
    .bind(passwordHash, nowIso(), userRow.id)
    .run();

  return c.json({ success: true, message: "Wachtwoord opnieuw ingesteld." });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
auth.get("/me", authMiddleware, async (c) => {
  const jwtUser = c.get("user");
  const row = await c.env.DB.prepare("SELECT * FROM users WHERE id = ? LIMIT 1")
    .bind(jwtUser.id).first<UserRow>();
  if (!row) return c.json({ error: "User not found" }, 404);
  const user = userFromRow(row)!;
  const { passwordHash, resetToken, resetTokenExpiry, ...safe } = user;
  return c.json({ user: safe });
});

export default auth;
