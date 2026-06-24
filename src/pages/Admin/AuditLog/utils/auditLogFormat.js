export function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(date);
}

export function formatJsonPreview(value) {
  if (!value || typeof value !== "object") return "-";
  const keys = Object.keys(value);
  if (!keys.length) return "-";

  return keys.slice(0, 2).join(", ") + (keys.length > 2 ? ` +${keys.length - 2}` : "");
}

export function actionTone(action = "") {
  const normalized = String(action).toLowerCase();

  if (["create", "created", "store"].includes(normalized)) {
    return "emerald";
  }

  if (["update", "updated", "restore", "restored"].includes(normalized)) {
    return "blue";
  }

  if (["delete", "deleted", "void", "cancel", "cancelled"].includes(normalized)) {
    return "red";
  }

  if (["login", "logout"].includes(normalized)) {
    return "purple";
  }

  return "amber";
}

export function moduleLabel(module = "") {
  return String(module)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

