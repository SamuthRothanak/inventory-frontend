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

const MODULE_LABELS = {
  auth:       "ការចូលប្រើ",
  sales:      "លក់",
  purchases:  "ទិញ",
  inventory:  "ស្តុក",
  products:   "ផលិតផល",
  categories: "ប្រភេទ",
  users:      "អ្នកប្រើ",
  settings:   "ការកំណត់",
  customers:  "អតិថិជន",
  suppliers:  "អ្នកផ្គត់ផ្គង់",
};

export function moduleLabel(module = "") {
  const key = String(module).toLowerCase();
  return MODULE_LABELS[key] ?? String(module).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const ACTION_LABELS = {
  login:     "ចូលប្រើ",
  logout:    "ចេញ",
  created:   "បានបង្កើត",
  updated:   "បានកែ",
  deleted:   "បានលុប",
  cancelled: "បានបោះបង់",
  restored:  "បានស្ដារ",
  void:      "បានលុបចោល",
};

export function actionLabel(action = "") {
  const key = String(action).toLowerCase();
  return ACTION_LABELS[key] ?? action;
}

export function translateDescription(text = "") {
  if (!text) return "-";

  let m;

  // User "X" logged in.
  m = text.match(/^User "(.+)" logged in\.$/i);
  if (m) return `អ្នកប្រើ "${m[1]}" បានចូលប្រើ។`;

  // User "X" logged out.
  m = text.match(/^User "(.+)" logged out\.$/i);
  if (m) return `អ្នកប្រើ "${m[1]}" បានចេញ។`;

  // Sale #X created. Total: $Y.
  m = text.match(/^Sale #(.+) created\.\s*Total:\s*\$(.+)\.$/i);
  if (m) return `វិក្កយបត្រ #${m[1]} បានបង្កើត។ សរុប: $${m[2]}`;

  // Purchase #X created.
  m = text.match(/^Purchase #(.+) created\.$/i);
  if (m) return `ការទិញ #${m[1]} បានបង្កើត។`;

  // Purchase #X updated.
  m = text.match(/^Purchase #(.+) updated\.$/i);
  if (m) return `ការទិញ #${m[1]} បានកែ។`;

  // Purchase #X deleted.
  m = text.match(/^Purchase #(.+) deleted\.$/i);
  if (m) return `ការទិញ #${m[1]} បានលុប។`;

  // Product "X" created/updated/deleted.
  m = text.match(/^Product "(.+)" (created|updated|deleted)\.$/i);
  if (m) return `ផលិតផល "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // Category "X" created/updated/deleted.
  m = text.match(/^Categor\w+ "(.+)" (created|updated|deleted)\.$/i);
  if (m) return `ប្រភេទ "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // User "X" created/updated/deleted.
  m = text.match(/^User "(.+)" (created|updated|deleted)\.$/i);
  if (m) return `អ្នកប្រើ "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // Stock adjusted / received
  m = text.match(/^Stock (adjusted|received) for (.+)\.$/i);
  if (m) return `ស្តុក${m[1] === "adjusted" ? "បានកែ" : "បានទទួល"}សម្រាប់ ${m[2]}។`;

  // Confirmed purchase stock in for X
  m = text.match(/^Confirmed purchase stock in for (.+)\.$/i);
  if (m) return `បានបញ្ជាក់ស្តុកចូលសម្រាប់ ${m[1]}។`;

  // Stock-in confirmed for Purchase #X
  m = text.match(/^Stock-in confirmed for Purchase #(.+)\.$/i);
  if (m) return `បានបញ្ជាក់ស្តុកចូលសម្រាប់ការទិញ #${m[1]}។`;

  // Payment recorded for Purchase #X
  m = text.match(/^Payment recorded for Purchase #(.+)\.$/i);
  if (m) return `បានកត់ត្រាការទូទាត់សម្រាប់ការទិញ #${m[1]}។`;

  // Stock adjusted for X
  m = text.match(/^Stock adjusted for (.+)\.$/i);
  if (m) return `បានកែស្តុកសម្រាប់ ${m[1]}។`;

  // Stock received for X
  m = text.match(/^Stock received for (.+)\.$/i);
  if (m) return `បានទទួលស្តុកសម្រាប់ ${m[1]}។`;

  // Generic: X created/updated/deleted.
  m = text.match(/^(.+)\s(created|updated|deleted|cancelled|restored)\.$/ );
  if (m) return `${m[1]} ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  return text;
}

