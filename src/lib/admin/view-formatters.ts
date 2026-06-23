export const formatDay = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
};

export const formatDayLong = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getJsonPreview = (raw: string, maxLength = 180): string => {
  let content = raw;

  try {
    content = JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    content = raw;
  }

  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength)}...`;
};

export const formatEventType = (type: string): string => {
  if (!type) return "";
  const customMappings: Record<string, string> = {
    public_page_view: "Public Page View",
    public_heartbeat: "Public Heartbeat",
    admin_login_success: "Admin Login Success",
    admin_logout: "Admin Logout",
    setting_updated: "Setting Updated",
    cms_saved: "CMS Saved",
    cms_deleted: "CMS Deleted",
    manual_monitoring_note: "Manual Monitoring Note",
    admin_action_failed: "Admin Action Failed",
  };
  if (customMappings[type]) {
    return customMappings[type];
  }
  return type
    .split(/[-_]/)
    .map((word) => {
      if (word.toLowerCase() === "cms") return "CMS";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

export const formatSettingKey = (key: string): string => {
  if (!key) return "";
  return key
    .split(/[-_]/)
    .map((word) => {
      if (word.toLowerCase() === "cms") return "CMS";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

export const renderCmsPreview = (jsonStr: string): string => {
  try {
    const data = JSON.parse(jsonStr);
    if (typeof data !== "object" || data === null) {
      return jsonStr;
    }
    return Object.entries(data)
      .map(([key, val]) => {
        const formattedKey = key
          .split(/[-_]/)
          .map((w) => {
            if (w.toLowerCase() === "cms") return "CMS";
            return w.charAt(0).toUpperCase() + w.slice(1);
          })
          .join(" ");
        // If value is object/array, format as JSON string, otherwise plain text
        const valStr = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `${formattedKey}: ${valStr}`;
      })
      .join("\n");
  } catch {
    return jsonStr;
  }
};
