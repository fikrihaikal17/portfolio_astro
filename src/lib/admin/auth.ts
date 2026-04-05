import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { executeQuery, queryRows } from "@/lib/admin/db";

interface AdminUserWithPassword extends RowDataPacket {
  id: number;
  username: string;
  role: string;
  is_active: number;
  password_hash: string;
}

interface AuthUserRow extends RowDataPacket {
  id: number;
  username: string;
  role: string;
}

export interface AdminAuthUser {
  id: number;
  username: string;
  role: string;
}

export const adminCookieName =
  (import.meta.env.ADMIN_SESSION_COOKIE_NAME as string | undefined)?.trim() ||
  "superadmin_session";

const getSessionTtlHours = (): number => {
  const raw = Number(import.meta.env.ADMIN_SESSION_TTL_HOURS ?? "12");
  if (Number.isNaN(raw) || raw <= 0) {
    return 12;
  }
  return raw;
};

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
};

export const verifyAdminCredentials = async (
  username: string,
  password: string
): Promise<AdminAuthUser | null> => {
  const rows = await queryRows<AdminUserWithPassword[]>(
    `
      SELECT id, username, role, is_active, password_hash
      FROM admin_users
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );

  const user = rows[0];
  if (!user || user.is_active !== 1) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
};

export const createAdminSession = async (
  userId: number,
  request: Request
): Promise<{ token: string; expiresAt: Date }> => {
  const token = randomBytes(32).toString("hex");
  const ttlHours = getSessionTtlHours();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await executeQuery(
    `
      INSERT INTO admin_sessions (
        user_id,
        session_token,
        ip_address,
        user_agent,
        expires_at,
        last_seen_at
      ) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())
    `,
    [
      userId,
      token,
      getClientIp(request),
      request.headers.get("user-agent") || "unknown",
      expiresAt,
    ]
  );

  return { token, expiresAt };
};

export const getAdminBySessionToken = async (
  token: string
): Promise<AdminAuthUser | null> => {
  const rows = await queryRows<AuthUserRow[]>(
    `
      SELECT u.id, u.username, u.role
      FROM admin_sessions s
      INNER JOIN admin_users u ON u.id = s.user_id
      WHERE s.session_token = ?
        AND s.expires_at > UTC_TIMESTAMP()
        AND u.is_active = 1
      LIMIT 1
    `,
    [token]
  );

  const user = rows[0];
  if (!user) {
    return null;
  }

  await executeQuery(
    `
      UPDATE admin_sessions
      SET last_seen_at = UTC_TIMESTAMP()
      WHERE session_token = ?
      LIMIT 1
    `,
    [token]
  );

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
};

export const revokeAdminSession = async (token: string): Promise<void> => {
  await executeQuery(
    `
      DELETE FROM admin_sessions
      WHERE session_token = ?
      LIMIT 1
    `,
    [token]
  );
};

export const revokeExpiredSessions = async (): Promise<void> => {
  await executeQuery(
    `
      DELETE FROM admin_sessions
      WHERE expires_at <= UTC_TIMESTAMP()
    `
  );
};
