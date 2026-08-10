// Shared with the Audit Log's permission-change diff (AuditLogDetailModal.jsx) — keep the
// translation logic in one place so a role's permission list reads identically whether you're
// looking at it in Roles.jsx or at a historical change in the audit log.
const PERMISSION_MODULE_LABELS = {
  dashboard: "ផ្ទាំងគ្រប់គ្រង",
  sales: "ការលក់",
  purchases: "ការទិញ",
  "purchase-items": "មុខទំនិញក្នុងការទិញ",
  purchase_returns: "ការត្រឡប់ការទិញ",
  purchase_return_items: "មុខទំនិញត្រឡប់ការទិញ",
  products: "ផលិតផល",
  "product-variants": "មុខទំនិញ",
  categories: "ប្រភេទទំនិញ",
  units: "ខ្នាតទំនិញ",
  stock: "ស្តុក",
  "stock-balances": "ស្តុកនៅសល់",
  "stock-movements": "ចលនាស្តុក",
  "inventory-batches": "បាច់ស្តុក",
  customers: "អតិថិជន",
  suppliers: "អ្នកផ្គត់ផ្គង់",
  reports: "របាយការណ៍",
  users: "អ្នកប្រើប្រាស់",
  roles: "តួនាទី",
  permissions: "សិទ្ធិប្រើប្រាស់",
  "exchange-rate": "អត្រាប្តូរប្រាក់",
  "audit-log": "កំណត់ហេតុ",
  settings: "ការកំណត់",
  backups: "ទិន្នន័យបម្រុងទុក",
};

const PERMISSION_ACTION_LABELS = {
  view: "មើល",
  create: "បង្កើត",
  update: "កែប្រែ",
  delete: "លុប",
  adjust: "កែសម្រួល",
  receive: "ទទួលចូល",
  "stock-in": "បញ្ចូលស្តុក",
  void: "បោះបង់",
  refund: "សងប្រាក់",
  print_receipt: "បោះពុម្ពបង្កាន់ដៃ",
  assign: "កំណត់",
  restore: "ស្ដារឡើងវិញ",
  sales: "ការលក់",
  inventory: "ស្តុក",
  profit: "ប្រាក់ចំណេញ",
  expenses: "ចំណាយ",
};

export const getPermissionLabel = (name) => {
  const [module, ...actionParts] = String(name ?? "").split(".");
  const action = actionParts.join(".");
  const moduleLabel = PERMISSION_MODULE_LABELS[module] ?? module;
  const actionLabel = PERMISSION_ACTION_LABELS[action] ?? action.replaceAll("_", " ");

  if (module === "reports") return `មើលរបាយការណ៍${actionLabel}`;
  return `${actionLabel}${moduleLabel}`;
};
