import type { RowDataPacket } from "mysql2/promise";
import { executeQuery, queryRows } from "@/lib/admin/db";

export interface SiteSetting extends RowDataPacket {
  id: number;
  setting_key: string;
  setting_value: string;
  value_type: "string" | "number" | "boolean" | "json";
  updated_at: string;
}

export interface CmsEntry extends RowDataPacket {
  id: number;
  slug: string;
  title: string;
  content_json: string;
  is_published: number;
  updated_at: string;
}

export interface MonitoringEvent extends RowDataPacket {
  id: number;
  event_type: string;
  level: "info" | "warning" | "error";
  source: string;
  message: string;
  payload_json: string | null;
  created_at: string;
}

export interface ActiveSession extends RowDataPacket {
  id: number;
  username: string;
  role: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
}

export interface DailyPublicView extends RowDataPacket {
  view_date: string;
  total_views: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export const getAllSettings = async (): Promise<SiteSetting[]> => {
  return queryRows<SiteSetting[]>(
    `
      SELECT id, setting_key, setting_value, value_type, updated_at
      FROM site_settings
      ORDER BY setting_key ASC
    `
  );
};

export const upsertSetting = async (
  settingKey: string,
  settingValue: string,
  valueType: SiteSetting["value_type"],
  userId: number
): Promise<void> => {
  await executeQuery(
    `
      INSERT INTO site_settings (setting_key, setting_value, value_type, updated_by)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        value_type = VALUES(value_type),
        updated_by = VALUES(updated_by),
        updated_at = UTC_TIMESTAMP()
    `,
    [settingKey, settingValue, valueType, userId]
  );
};

export const getAllCmsEntries = async (): Promise<CmsEntry[]> => {
  return queryRows<CmsEntry[]>(
    `
      SELECT id, slug, title, content_json, is_published, updated_at
      FROM cms_pages
      ORDER BY slug ASC
    `
  );
};

export const upsertCmsEntry = async (
  slug: string,
  title: string,
  contentJson: string,
  isPublished: boolean,
  userId: number
): Promise<void> => {
  await executeQuery(
    `
      INSERT INTO cms_pages (slug, title, content_json, is_published, updated_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        content_json = VALUES(content_json),
        is_published = VALUES(is_published),
        updated_by = VALUES(updated_by),
        updated_at = UTC_TIMESTAMP()
    `,
    [slug, title, contentJson, isPublished ? 1 : 0, userId]
  );
};

export const deleteCmsEntry = async (id: number): Promise<void> => {
  await executeQuery(
    `
      DELETE FROM cms_pages
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
};

export const logAdminEvent = async (
  eventType: string,
  source: string,
  message: string,
  level: "info" | "warning" | "error" = "info",
  payload?: Record<string, unknown> | null,
  userId?: number
): Promise<void> => {
  await executeQuery(
    `
      INSERT INTO monitoring_events (user_id, event_type, source, message, level, payload_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [userId ?? null, eventType, source, message, level, payload ? JSON.stringify(payload) : null]
  );
};

export const getRecentMonitoringEvents = async (
  limit = 20
): Promise<MonitoringEvent[]> => {
  return queryRows<MonitoringEvent[]>(
    `
      SELECT id, event_type, level, source, message, payload_json, created_at
      FROM monitoring_events
      ORDER BY created_at DESC
      LIMIT ?
    `,
    [limit]
  );
};

export const getDailyPublicViews = async (
  days = 14
): Promise<DailyPublicView[]> => {
  const windowDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 14;
  const cutoff = new Date(Date.now() - (windowDays - 1) * 24 * 60 * 60 * 1000);
  cutoff.setUTCHours(0, 0, 0, 0);

  return queryRows<DailyPublicView[]>(
    `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d') AS view_date,
        COUNT(*) AS total_views
      FROM monitoring_events
      WHERE created_at >= ?
        AND event_type != 'public_heartbeat'
        AND (
          event_type IN ('public_page_view', 'page_view', 'public_view')
          OR source IN ('public-web', 'public-site', 'website')
        )
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY view_date ASC
    `,
    [cutoff]
  );
};

export const getActiveSessions = async (limit = 20): Promise<ActiveSession[]> => {
  return queryRows<ActiveSession[]>(
    `
      SELECT s.id, u.username, u.role, s.ip_address, s.user_agent, s.created_at, s.last_seen_at, s.expires_at
      FROM admin_sessions s
      INNER JOIN admin_users u ON u.id = s.user_id
      WHERE s.expires_at > UTC_TIMESTAMP()
      ORDER BY s.last_seen_at DESC
      LIMIT ?
    `,
    [limit]
  );
};

export const getMonitoringSummary = async (): Promise<{
  totalSettings: number;
  totalCmsPages: number;
  totalEvents: number;
  activeSessions: number;
}> => {
  const [settingsCount] = await queryRows<CountRow[]>(
    `SELECT COUNT(*) AS total FROM site_settings`
  );
  const [cmsCount] = await queryRows<CountRow[]>(
    `SELECT COUNT(*) AS total FROM cms_pages`
  );
  const [eventCount] = await queryRows<CountRow[]>(
    `SELECT COUNT(*) AS total FROM monitoring_events`
  );
  const [sessionCount] = await queryRows<CountRow[]>(
    `SELECT COUNT(*) AS total FROM admin_sessions WHERE expires_at > UTC_TIMESTAMP()`
  );

  return {
    totalSettings: settingsCount?.total ?? 0,
    totalCmsPages: cmsCount?.total ?? 0,
    totalEvents: eventCount?.total ?? 0,
    activeSessions: sessionCount?.total ?? 0,
  };
};

export interface HourlyPublicView extends RowDataPacket {
  view_hour: string;
  total_views: number;
}

export const getHourlyPublicViews = async (
  hours = 24
): Promise<HourlyPublicView[]> => {
  const windowHours = Number.isFinite(hours) && hours > 0 ? Math.floor(hours) : 24;
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  return queryRows<HourlyPublicView[]>(
    `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00') AS view_hour,
        COUNT(*) AS total_views
      FROM monitoring_events
      WHERE created_at >= ?
        AND event_type != 'public_heartbeat'
        AND (
          event_type IN ('public_page_view', 'page_view', 'public_view')
          OR source IN ('public-web', 'public-site', 'website')
        )
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00')
      ORDER BY view_hour ASC
    `,
    [cutoff]
  );
};

