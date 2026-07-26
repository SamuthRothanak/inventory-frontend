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

// Raw snake_case DB column names old_values/new_values are keyed by — shown here translated
// instead of verbatim (e.g. "purchase_no" -> "លេខការទិញ"). Only covers the fields this app's
// controllers actually log (see the various logFromRequest calls' oldValues/newValues); an
// unmapped key just falls back to itself rather than showing blank.
const CHANGE_FIELD_LABELS = {
  name: "ឈ្មោះ",
  purchase_no: "លេខការទិញ",
  sale_no: "លេខការលក់",
  sale_id: "លេខការលក់",
  total_amount_usd: "តម្លៃសរុប (USD)",
  grand_total_usd: "តម្លៃសរុប (USD)",
  payment_status: "ស្ថានភាពទូទាត់",
  return_type: "ប្រភេទត្រឡប់",
};

export function changeFieldLabel(key) {
  return CHANGE_FIELD_LABELS[key] ?? key;
}

export function formatJsonPreview(value) {
  if (!value || typeof value !== "object") return "-";
  const keys = Object.keys(value);
  if (!keys.length) return "-";

  const shown = keys.slice(0, 2).map((key) => {
    const fieldValue = value[key];
    const displayValue = fieldValue === null || fieldValue === undefined || fieldValue === "" ? "-" : String(fieldValue);
    return `${changeFieldLabel(key)}: ${displayValue}`;
  });

  return shown.join(", ") + (keys.length > 2 ? ` +${keys.length - 2}` : "");
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

// The "ឯកសារ" column used to show the raw internal ref_id (e.g. "#168") right next to the
// description's own human-readable identifier (e.g. "PUR-20260726-00167") — two different
// numbering schemes that happen to look alike, inviting the reader to expect them to match when
// they never do (ref_id is a plain auto-increment counter; purchase_no/sale_no etc. have their
// own separate, gap-prone sequence). Pull the SAME identifier the description already names
// instead, so this column and the description agree.
export function extractRefLabel(description = "") {
  if (!description) return null;

  const hashMatch = description.match(/#([\w-]+)/);
  if (hashMatch) return `#${hashMatch[1]}`;

  const quoteMatch = description.match(/"([^"]+)"/);
  if (quoteMatch) return `"${quoteMatch[1]}"`;

  return null;
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

  // Supplier credit applied to Purchase #X
  m = text.match(/^Supplier credit applied to Purchase #(.+)\.$/i);
  if (m) return `បានអនុវត្តលុយកាត់លើកក្រោយទៅលើការទិញ #${m[1]}។`;

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

