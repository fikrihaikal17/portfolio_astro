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
