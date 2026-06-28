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

export interface ProjectRow extends RowDataPacket {
  id: number;
  title: string;
  link: string;
  preview: string;
  status_key: string;
  status_text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CertificateRow extends RowDataPacket {
  id: number;
  provider: string;
  year: string;
  title: string;
  issuer: string;
  credential_id: string;
  verification_url: string;
  preview_pdf: string;
  tags: string;
  score: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TranslationRow extends RowDataPacket {
  id: number;
  translation_key: string;
  en: string;
  id_text: string;
  created_at: string;
  updated_at: string;
}

// Projects
export const getAllProjects = async (): Promise<ProjectRow[]> => {
  return queryRows<ProjectRow[]>(
    `SELECT id, title, link, preview, status_key, status_text, order_index, created_at, updated_at
     FROM portfolio_projects
     ORDER BY order_index ASC`
  );
};

export const upsertProject = async (
  id: number | null,
  title: string,
  link: string,
  preview: string,
  statusKey: string,
  statusText: string,
  orderIndex = 0
): Promise<void> => {
  if (id && id > 0) {
    await executeQuery(
      `UPDATE portfolio_projects
       SET title = ?, link = ?, preview = ?, status_key = ?, status_text = ?, order_index = ?
       WHERE id = ?`,
      [title, link, preview, statusKey, statusText, orderIndex, id]
    );
  } else {
    await executeQuery(
      `INSERT INTO portfolio_projects (title, link, preview, status_key, status_text, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, link, preview, statusKey, statusText, orderIndex]
    );
  }
};

export const deleteProject = async (id: number): Promise<void> => {
  await executeQuery(
    `DELETE FROM portfolio_projects WHERE id = ? LIMIT 1`,
    [id]
  );
};

// Certificates
export const getAllCertificates = async (): Promise<CertificateRow[]> => {
  return queryRows<CertificateRow[]>(
    `SELECT id, provider, year, title, issuer, credential_id, verification_url, preview_pdf, tags, score, order_index, created_at, updated_at
     FROM portfolio_certificates
     ORDER BY order_index ASC`
  );
};

export const upsertCertificate = async (
  id: number | null,
  provider: string,
  year: string,
  title: string,
  issuer: string,
  credentialId: string,
  verificationUrl: string,
  previewPdf: string,
  tags: string,
  score: string | null,
  orderIndex = 0
): Promise<void> => {
  if (id && id > 0) {
    await executeQuery(
      `UPDATE portfolio_certificates
       SET provider = ?, year = ?, title = ?, issuer = ?, credential_id = ?, verification_url = ?, preview_pdf = ?, tags = ?, score = ?, order_index = ?
       WHERE id = ?`,
      [provider, year, title, issuer, credentialId, verificationUrl, previewPdf, tags, score, orderIndex, id]
    );
  } else {
    await executeQuery(
      `INSERT INTO portfolio_certificates (provider, year, title, issuer, credential_id, verification_url, preview_pdf, tags, score, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [provider, year, title, issuer, credentialId, verificationUrl, previewPdf, tags, score, orderIndex]
    );
  }
};

export const deleteCertificate = async (id: number): Promise<void> => {
  await executeQuery(
    `DELETE FROM portfolio_certificates WHERE id = ? LIMIT 1`,
    [id]
  );
};

// Translations
export const getAllTranslations = async (): Promise<TranslationRow[]> => {
  return queryRows<TranslationRow[]>(
    `SELECT id, translation_key, en, id_text, created_at, updated_at
     FROM site_translations
     ORDER BY translation_key ASC`
  );
};

export const upsertTranslation = async (
  id: number | null,
  translationKey: string,
  en: string,
  idText: string
): Promise<void> => {
  if (id && id > 0) {
    await executeQuery(
      `UPDATE site_translations
       SET translation_key = ?, en = ?, id_text = ?
       WHERE id = ?`,
      [translationKey, en, idText, id]
    );
  } else {
    await executeQuery(
      `INSERT INTO site_translations (translation_key, en, id_text)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE en = VALUES(en), id_text = VALUES(id_text)`,
      [translationKey, en, idText]
    );
  }
};

export const deleteTranslation = async (id: number): Promise<void> => {
  await executeQuery(
    `DELETE FROM site_translations WHERE id = ? LIMIT 1`,
    [id]
  );
};

export interface SkillRow extends RowDataPacket {
  id: number;
  slug: string;
  label: string;
  image_url: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const getAllSkills = async (): Promise<SkillRow[]> => {
  return queryRows<SkillRow[]>(
    `SELECT id, slug, label, image_url, order_index, created_at, updated_at
     FROM portfolio_skills
     ORDER BY order_index ASC`
  );
};

export const upsertSkill = async (
  id: number | null,
  slug: string,
  label: string,
  imageUrl: string,
  orderIndex = 0
): Promise<void> => {
  if (id && id > 0) {
    await executeQuery(
      `UPDATE portfolio_skills
       SET slug = ?, label = ?, image_url = ?, order_index = ?
       WHERE id = ?`,
      [slug, label, imageUrl, orderIndex, id]
    );
  } else {
    await executeQuery(
      `INSERT INTO portfolio_skills (slug, label, image_url, order_index)
       VALUES (?, ?, ?, ?)`,
      [slug, label, imageUrl, orderIndex]
    );
  }
};

export const deleteSkill = async (id: number): Promise<void> => {
  await executeQuery(
    `DELETE FROM portfolio_skills WHERE id = ? LIMIT 1`,
    [id]
  );
};

export const getSettingValue = async (key: string, defaultValue = ""): Promise<string> => {
  try {
    const rows = await queryRows<SiteSetting[]>(
      `SELECT setting_value FROM site_settings WHERE setting_key = ? LIMIT 1`,
      [key]
    );
    return rows.length > 0 ? rows[0].setting_value : defaultValue;
  } catch {
    return defaultValue;
  }
};

