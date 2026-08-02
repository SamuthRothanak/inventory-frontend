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
  purchase_return_no: "លេខបណ្ណត្រឡប់ទំនិញ",
  purchase_id: "ការទិញ",
  purchase_return_id: "បណ្ណត្រឡប់ទំនិញ",
  product_variant_unit_id: "ផលិតផល / ឯកតា",
  status: "ស្ថានភាព",
  payment_mode: "របៀបទូទាត់",
  grand_total_khr: "តម្លៃសរុប (KHR)",
  paid_amount_usd: "បានបង់ (USD)",
  paid_amount_khr: "បានបង់ (KHR)",
  balance_amount_usd: "នៅខ្វះ (USD)",
  balance_amount_khr: "នៅខ្វះ (KHR)",
  invoiced_qty: "ចំនួនក្នុងវិក្កយបត្រ",
  paid_qty: "ចំនួនបានបង់",
  received_qty: "ចំនួនបានទទួល",
  accepted_qty: "ចំនួនបានទទួលយក",
  stocked_in_qty: "ចំនួនបានបញ្ចូលស្តុក",
  damaged_qty: "ចំនួនខូច",
  claim_qty: "ចំនួនទាមទារ",
  unit_cost_usd: "ថ្លៃដើមឯកតា (USD)",
  line_total_usd: "តម្លៃជួរ (USD)",
  return_reason: "មូលហេតុត្រឡប់",
  resolution_type: "វិធីដោះស្រាយ",
  resolution_status: "ស្ថានភាពដោះស្រាយ",
  refund_status: "ស្ថានភាពសងប្រាក់",
  credit_status: "ស្ថានភាពលុយកាត់លើកក្រោយ",
  items: "ទំនិញ",
  name: "ឈ្មោះ",
  purchase_no: "លេខការទិញ",
  sale_no: "លេខការលក់",
  sale_id: "លេខការលក់",
  total_amount_usd: "តម្លៃសរុប (USD)",
  grand_total_usd: "តម្លៃសរុប (USD)",
  payment_status: "ស្ថានភាពទូទាត់",
  return_type: "ប្រភេទត្រឡប់",
  reject_reason: "មូលហេតុបដិសេធ",
  refund_method: "វិធីសងប្រាក់",
  refund_provider_name: "អ្នកផ្តល់សេវាសងប្រាក់",
  refund_reference_no: "លេខយោងសងប្រាក់",
  refund_currency: "រូបិយប័ណ្ណសងប្រាក់",
  refund_amount_input: "ចំនួនទឹកប្រាក់សង",
  refund_exchange_rate_used: "អត្រាប្តូរប្រាក់ដែលប្រើ",
  username: "ឈ្មោះប្រើប្រាស់",
  email: "អ៊ីមែល",
  role: "តួនាទី",
  permissions: "សិទ្ធិប្រើប្រាស់",
  rate_date: "កាលបរិច្ឆេទអត្រា",
  usd_to_khr_rate: "អត្រា USD ទៅ KHR",
  applies_to: "អនុវត្តចំពោះ",
  min_qty: "ចំនួនអប្បបរមា",
  unit_price_usd: "តម្លៃឯកតា (USD)",
  unit_price_khr: "តម្លៃឯកតា (KHR)",
  file_name: "ឈ្មោះឯកសារ",
  phone: "លេខទូរស័ព្ទ",
  unit_name: "ឈ្មោះខ្នាត",
  unit_code: "កូដខ្នាត",
  unit_type: "ប្រភេទខ្នាត",
  qty_on_hand: "ចំនួននៅសល់",
  qty_reserved: "ចំនួនបានកក់",
  qty_available: "ចំនួនអាចប្រើបាន",
  batch_no: "លេខជុំស្តុក",
  qty_received_base: "ចំនួនទទួល",
  qty_remaining_base: "ចំនួននៅសល់",
  expired_date: "កាលបរិច្ឆេទផុតកំណត់",
  variant_name: "ឈ្មោះម៉ូដែល",
  variant_code: "កូដម៉ូដែល",
  unit_id: "ខ្នាត",
  conversion_qty: "អត្រាបំលែង",
  movement_type: "ប្រភេទចលនា",
  qty_base: "ចំនួន",
  note: "កំណត់ចំណាំ",
  adjustment_no: "លេខការកែតម្រូវស្តុក",
  adjustment_type: "ប្រភេទការកែតម្រូវ",
  reason: "មូលហេតុ",
  shop_name: "ឈ្មោះហាង",
  contact_name: "ឈ្មោះទំនាក់ទំនង",
  address: "អាសយដ្ឋាន",
  category_id: "ប្រភេទ",
  images: "រូបភាព",
  description: "ការពិពណ៌នា",
  // Added covering the wide audit-log field-coverage sweep (see project_audit_log_field_coverage)
  // — SaleController
  customer_id: "អតិថិជន",
  sale_type: "ប្រភេទការលក់",
  sale_channel: "មធ្យោបាយលក់",
  invoice_currency: "រូបិយប័ណ្ណវិក្កយបត្រ",
  exchange_rate_khr_per_usd: "អត្រាប្តូរប្រាក់ (USD ទៅ KHR)",
  khr_rounding: "ការបង្គត់ KHR",
  subtotal_usd: "សរុបរង (USD)",
  discount_total_usd: "បញ្ចុះតម្លៃសរុប (USD)",
  delivery_option: "ជម្រើសដឹកជញ្ជូន",
  delivery_fee_usd: "ថ្លៃដឹកជញ្ជូន (USD)",
  delivery_paid_by: "អ្នកបង់ថ្លៃដឹកជញ្ជូន",
  delivery_status: "ស្ថានភាពដឹកជញ្ជូន",
  delivery_address: "អាសយដ្ឋានដឹកជញ្ជូន",
  paid_total_usd: "បានបង់សរុប (USD)",
  balance_total_usd: "នៅខ្វះសរុប (USD)",
  sale_status: "ស្ថានភាពការលក់",
  sold_at: "ពេលវេលាលក់",
  cancel_reason: "មូលហេតុបោះបង់",
  customer_name_snapshot: "ឈ្មោះអតិថិជន (ពេលនោះ)",
  customer_phone_snapshot: "លេខទូរស័ព្ទអតិថិជន (ពេលនោះ)",
  qty: "ចំនួន",
  unit_price: "តម្លៃឯកតា",
  // SalesReturnController
  verification_type: "វិធីផ្ទៀងផ្ទាត់",
  exchange_rate_used: "អត្រាប្តូរប្រាក់ដែលប្រើ",
  replacement_sale_id: "ការលក់ជំនួស",
  returned_at: "ពេលវេលាត្រឡប់",
  // PurchaseController / PurchaseItemController
  supplier_id: "អ្នកផ្គត់ផ្គង់",
  purchase_date: "កាលបរិច្ឆេទទិញ",
  input_currency: "រូបិយប័ណ្ណបញ្ចូល",
  exchange_rate_source: "ប្រភពអត្រាប្តូរប្រាក់",
  exchange_rate_note: "កំណត់ចំណាំអត្រាប្តូរប្រាក់",
  discount_currency: "រូបិយប័ណ្ណបញ្ចុះតម្លៃ",
  discount_amount_input: "ចំនួនបញ្ចុះតម្លៃ",
  delivery_fee_currency: "រូបិយប័ណ្ណថ្លៃដឹកជញ្ជូន",
  delivery_fee_input: "ចំនួនថ្លៃដឹកជញ្ជូន",
  paid_currency: "រូបិយប័ណ្ណបង់ប្រាក់",
  paid_amount_input: "ចំនួនបង់ប្រាក់",
  input_unit_cost: "ថ្លៃដើមឯកតាបញ្ចូល",
  line_total_khr: "តម្លៃជួរ (KHR)",
  // PurchaseReturnController
  refund_amount_usd: "ចំនួនសងប្រាក់ (USD)",
  refund_amount_khr: "ចំនួនសងប្រាក់ (KHR)",
  refunded_at: "ពេលវេលាសងប្រាក់",
  replacement_purchase_id: "ការទិញជំនួស",
  replacement_stocked_in_qty: "ចំនួនជំនួសបានបញ្ចូលស្តុក",
  credit_note_no: "លេខបណ្ណលុយកាត់លើកក្រោយ",
  credit_amount_usd: "ចំនួនលុយកាត់ (USD)",
  credit_amount_khr: "ចំនួនលុយកាត់ (KHR)",
  resolved_at: "ពេលវេលាដោះស្រាយ",
  // InventoryBatchController
  product_variant_id: "ម៉ូដែលផលិតផល",
  purchase_item_id: "ទំនិញទិញ",
  lot_no: "លេខឡូត៍",
  unit_cost_khr: "ថ្លៃដើមឯកតា (KHR)",
  unit_cost_base: "ថ្លៃដើមឯកតាមូលដ្ឋាន",
  unit_cost_base_usd: "ថ្លៃដើមឯកតាមូលដ្ឋាន (USD)",
  unit_cost_base_khr: "ថ្លៃដើមឯកតាមូលដ្ឋាន (KHR)",
  received_at: "ពេលវេលាទទួល",
  // PriceRuleController
  input_price: "តម្លៃបញ្ចូល",
  // ProductVariantController
  product_id: "ផលិតផល",
  package_type: "ប្រភេទវេចខ្ចប់",
  color: "ពណ៌",
  size_value: "ទំហំ",
  size_unit: "ខ្នាតទំហំ",
  low_stock_threshold: "កម្រិតស្តុកទាប",
  // PurchaseReturnItemController
  base_qty: "ចំនួនមូលដ្ឋាន",
  condition: "ស្ថានភាពទំនិញ",
  stock_action: "សកម្មភាពស្តុក",
  // SupplierController
  contact_person: "អ្នកទំនាក់ទំនង",
  // UnitController
  allow_decimal: "អនុញ្ញាតទសភាគ",
  // ProductVariantUnitController
  barcode: "បាកូដ",
  is_base_unit: "ជាឯកតាមូលដ្ឋាន",
  is_default_sale_unit: "ជាឯកតាលក់លំនាំដើម",
  is_default_purchase_unit: "ជាឯកតាទិញលំនាំដើម",
  // StockAdjustmentController
  line_cost: "ថ្លៃដើមជួរ",
};

export function changeFieldLabel(key) {
  return CHANGE_FIELD_LABELS[key] ?? key;
}

const AUDIT_VALUE_LABELS = {
  draft: "ព្រាង",
  pending: "កំពុងរង់ចាំ",
  pending_receive: "រង់ចាំទទួល",
  pending_stock_in: "រង់ចាំបញ្ចូលស្តុក",
  pending_claim: "រង់ចាំដោះស្រាយការទាមទារ",
  received: "ស្តុកចូលរួចរាល់អស់",
  completed: "បានបញ្ចប់",
  approved: "បានអនុម័ត",
  rejected: "បានបដិសេធ",
  resolved: "បានដោះស្រាយ",
  cancelled: "បានបោះបង់",
  paid: "បានបង់រួច",
  unpaid: "មិនទាន់បង់",
  partial: "បានបង់ខ្លះ",
  refunded: "បានសងប្រាក់",
  // Role names (matches src/pages/Admin/Users/utils/userUtils.js's ROLE_LABELS exactly)
  admin: "អ្នកគ្រប់គ្រង",
  cashier: "អ្នកគិតលុយ",
  staff: "បុគ្គលិក",
  prepaid: "បង់មុន",
  partial_prepaid: "បង់មុនខ្លះ",
  pay_after_check: "បង់ក្រោយពិនិត្យ",
  replacement: "ប្តូរជំនួស",
  refund: "សងប្រាក់",
  credit_note: "លុយកាត់លើកក្រោយ",
  none: "លះបង់ការទាមទារ",
  submitted: "បានដាក់ស្នើ",
  issued: "បានចេញ",
  used: "បានប្រើ",
  active: "ដំណើរការ",
  inactive: "មិនដំណើរការ",
  retail: "លក់រាយ",
  wholesale: "លក់ដុំ",
  both: "ទាំងពីរ",
  mixed: "ចម្រុះ",
  stock_in: "ចូលស្តុក",
  stock_out: "ចេញស្តុក",
  purchase_in: "ទិញចូល",
  sale_out: "លក់ចេញ",
  purchase_return_out: "ត្រឡប់ការទិញចេញ",
  sale_return_in: "ត្រឡប់ការលក់ចូល",
  sale_return_replacement_out: "ប្តូរជំនួសចេញ",
  adjustment_in: "ការកែតម្រូវចូល",
  adjustment_out: "ការកែតម្រូវចេញ",
  damage_out: "ខូចខាតចេញ",
  expired_out: "ផុតកំណត់ចេញ",
  internal_use_out: "ដកប្រើប្រាស់ខ្លួនឯងចេញ",
  lost_out: "បាត់ចេញ",
  transfer_in: "ផ្ទេរចូល",
  transfer_out: "ផ្ទេរចេញ",
  // StockAdjustmentType (adjustment_type field)
  increase: "បង្កើន",
  decrease: "បន្ថយ",
  // StockAdjustmentReason (reason field) — "damaged"/"expired" also double as SalesReturn item
  // conditions elsewhere in the app; same Khmer word applies in both contexts, no override needed.
  damaged: "ខូច",
  expired: "ផុតកំណត់",
  internal_use: "ប្រើប្រាស់ខ្លួនឯង",
  lost: "បាត់",
  stock_count: "រាប់ស្តុក",
  correction: "កែតម្រូវ",
  other: "ផ្សេងទៀត",
  // Currency codes (input_currency/paid_currency/discount_currency/... on Purchase-side
  // records use lowercase "usd"/"khr"; Sale-side invoice_currency uses uppercase — both
  // normalize to the same lowercased key here).
  usd: "ដុល្លារ (USD)",
  khr: "រៀល (KHR)",
  // SaleChannel (sale_channel field)
  pos: "តាមហាង (POS)",
  web: "គេហទំព័រ",
  app: "កម្មវិធី",
  phone: "ទូរស័ព្ទ",
  // SaleStatus (sale_status field) — draft/completed/cancelled already covered above
  confirmed: "បានបញ្ជាក់",
  // SaleType (sale_type field) — retail/wholesale already covered above
  online: "អនឡាញ",
  // PurchaseDeliveryOption (delivery_option field) — "none" handled via FIELD_VALUE_OVERRIDES
  supplier_delivery: "អ្នកផ្គត់ផ្គង់ដឹកជញ្ជូន",
  self_pickup: "មកយកដោយខ្លួនឯង",
  third_party: "ភ្នាក់ងារដឹកជញ្ជូន",
  // PurchaseDeliveryPaidBy (delivery_paid_by field)
  buyer: "អ្នកទិញ",
  supplier: "អ្នកផ្គត់ផ្គង់",
  // Sales\DeliveryStatus (delivery_status field) — "pending" already covered above
  preparing: "កំពុងរៀបចំ",
  shipped: "កំពុងដឹកជញ្ជូន",
  delivered: "បានដឹកជញ្ជូនរួច",
  failed: "បរាជ័យ",
  // SalesReturnVerificationType (verification_type field)
  receipt: "ប្រៀបធៀបវិក្កយបត្រ",
  system_lookup: "ស្វែងរកក្នុងប្រព័ន្ធ",
  verbal: "សួរផ្ទាល់មាត់",
  photo: "រូបថត",
  // PurchaseReturnItemCondition (condition field) — "damaged"/"expired"/"other" already covered
  wrong_item: "ខុសទំនិញ",
  good: "ល្អ",
  // PurchaseReturnItemStockAction (stock_action field) — "stock_in"/"stock_out" already covered
  no_stock_change: "មិនប៉ះពាល់ស្តុក",
};

// "partial"/"full" mean different things depending on which field they're on (payment_status:
// "partial" = paid some; return_type: "partial" = returned some, "full" = returned everything).
// A single flat value→label map can't hold both — check the field-specific override first.
const FIELD_VALUE_OVERRIDES = {
  return_type: { full: "ត្រឡប់ពេញលេញ", partial: "ត្រឡប់ខ្លះ" },
  // Customer.status is a DB boolean (unlike its string-enum siblings elsewhere — see
  // project_product_view_missing_fields for the same quirk on product_variant_units.status),
  // so it serializes as the literal string "true"/"false", not one of the usual status words.
  // ProductVariant.status has no cast at all — it comes through as the raw DB integer "1"/"0".
  // All three shapes ("true"/"false" boolean, "1"/"0" raw int, and the string enum handled by
  // the global map) mean the same active/inactive thing everywhere "status" is used in this
  // app, so it's safe to fold all of them into one override scoped to this field key.
  status: { true: "ដំណើរការ", false: "មិនដំណើរការ", "1": "ដំណើរការ", "0": "មិនដំណើរការ" },
  // "none" already means "claim waived" globally (PurchaseReturn.resolution_type) — but on
  // these two fields it means "no delivery option/status selected", a different concept that
  // would otherwise collide with the global entry.
  delivery_option: { none: "គ្មាន" },
  delivery_status: { none: "គ្មាន" },
};

// Decimal-cast DB columns (exchange rates, costs, quantities — Laravel's `decimal:N` cast)
// always serialize with their full fixed precision, e.g. "4000.0000" for a decimal(15,4) rate
// that's really just a whole number. Trim insignificant trailing zeros (and a now-bare trailing
// "." ) so "4000.0000" reads as "4000" while a genuinely fractional value like "4100.5000"
// still reads as "4100.5" instead of losing real precision.
function trimTrailingZeros(numericString) {
  if (!numericString.includes(".")) return numericString;
  return numericString.replace(/0+$/, "").replace(/\.$/, "");
}

export function formatAuditValue(key, value) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return `${value.length} មុខទំនិញ`;
  if (typeof value === "object") return JSON.stringify(value);
  const raw = String(value).toLowerCase();
  const override = FIELD_VALUE_OVERRIDES[key];
  if (override && raw in override) return override[raw];
  if (AUDIT_VALUE_LABELS[raw]) return AUDIT_VALUE_LABELS[raw];
  if (/^-?\d+\.\d+$/.test(raw)) return trimTrailingZeros(String(value));
  return String(value);
}

export function formatJsonPreview(value) {
  if (!value || typeof value !== "object") return "-";
  const keys = Object.keys(value);
  if (!keys.length) return "-";

  const shown = keys.slice(0, 2).map((key) => {
    const fieldValue = value[key];
    const displayValue = formatAuditValue(key, fieldValue);
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
  roles:      "តួនាទី",
};

export function moduleLabel(module = "") {
  const key = String(module).toLowerCase();
  return MODULE_LABELS[key] ?? String(module).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// The "ឯកសារ" (document) column showed log.ref_table completely raw (e.g. "sales_returns") —
// every DB table name this app's controllers actually pass as refTable to
// ActivityLogService::logFromRequest (grep app/Http/Controllers for `refTable:`).
const REF_TABLE_LABELS = {
  sales: "ការលក់",
  sales_returns: "ការត្រឡប់ការលក់",
  purchases: "ការទិញ",
  purchase_items: "ទំនិញទិញ",
  purchase_returns: "ការត្រឡប់ការទិញ",
  purchase_return_items: "ទំនិញត្រឡប់ការទិញ",
  stock_adjustments: "ការកែតម្រូវស្តុក",
  products: "ផលិតផល",
  categories: "ប្រភេទ",
  users: "អ្នកប្រើ",
  roles: "តួនាទី",
  exchange_rates: "អត្រាប្តូរប្រាក់",
  price_rules: "កម្រិតតម្លៃ",
  backups: "ទិន្នន័យបម្រុងទុក",
  customers: "អតិថិជន",
  suppliers: "អ្នកផ្គត់ផ្គង់",
  units: "ខ្នាតទំនិញ",
  stock_balances: "សមតុល្យស្តុក",
  inventory_batches: "ជុំស្តុក",
  product_variants: "ម៉ូដែលផលិតផល",
  product_variant_units: "ឯកតាម៉ូដែលផលិតផល",
  stock_movements: "ចលនាស្តុក",
};

export function refTableLabel(refTable = "") {
  const key = String(refTable).toLowerCase();
  return REF_TABLE_LABELS[key] ?? String(refTable).replace(/[_-]+/g, " ");
}

const ACTION_LABELS = {
  login:        "ចូលប្រើ",
  login_failed: "ចូលប្រើបរាជ័យ",
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

  // Failed login attempt for "X".
  m = text.match(/^Failed login attempt for "(.+)"\.$/i);
  if (m) return `ការចូលប្រើបរាជ័យសម្រាប់ "${m[1]}"។`;

  // Sale #X created. Total: $Y.
  m = text.match(/^Sale #(.+) created\.\s*Total:\s*\$(.+)\.$/i);
  if (m) return `វិក្កយបត្រ #${m[1]} បានបង្កើត។ សរុប: $${m[2]}`;

  // Sale #X marked as completed.
  m = text.match(/^Sale #(.+) marked as completed\.$/i);
  if (m) return `វិក្កយបត្រ #${m[1]} បានបញ្ចប់។`;

  // Sale #X updated.
  m = text.match(/^Sale #(.+) updated\.$/i);
  if (m) return `វិក្កយបត្រ #${m[1]} បានកែប្រែ។`;

  // Sale #X voided.
  m = text.match(/^Sale #(.+) voided\.$/i);
  if (m) return `វិក្កយបត្រ #${m[1]} បានលុបចោល។`;

  // Payment recorded for Sale #X.
  m = text.match(/^Payment recorded for Sale #(.+)\.$/i);
  if (m) return `បានកត់ត្រាការទូទាត់សម្រាប់វិក្កយបត្រ #${m[1]}។`;

  // Sales return created for Sale #X. Total: $Y.
  m = text.match(/^Sales return created for Sale #(.+)\.\s*Total:\s*\$(.+)\.$/i);
  if (m) return `បណ្ណត្រឡប់ការលក់ បានបង្កើតសម្រាប់វិក្កយបត្រ #${m[1]}។ សរុប: $${m[2]}`;

  // Stock adjustment #X created and applied. / created. / approved and applied. / updated.
  m = text.match(/^Stock adjustment #(.+) created and applied\.$/i);
  if (m) return `ការកែតម្រូវស្តុក #${m[1]} បានបង្កើត និងអនុវត្តរួច។`;

  m = text.match(/^Stock adjustment #(.+) approved and applied\.$/i);
  if (m) return `ការកែតម្រូវស្តុក #${m[1]} បានអនុម័ត និងអនុវត្តរួច។`;

  m = text.match(/^Stock adjustment #(.+) (created|updated)\.$/i);
  if (m) return `ការកែតម្រូវស្តុក #${m[1]} ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // Purchase #X created.
  m = text.match(/^Purchase #(.+) created\.$/i);
  if (m) return `ការទិញ #${m[1]} បានបង្កើត។`;

  // Purchase #X updated.
  m = text.match(/^Purchase #(.+) updated\.$/i);
  if (m) return `ការទិញ #${m[1]} បានកែ។`;

  // Purchase #X deleted.
  m = text.match(/^Purchase #(.+) deleted\.$/i);
  if (m) return `ការទិញ #${m[1]} បានលុប។`;

  m = text.match(/^Purchase return #(.+) (created|updated|deleted)\.$/i);
  if (m) {
    const action = { created: "បានបង្កើត", updated: "បានកែប្រែ", deleted: "បានលុប" }[m[2].toLowerCase()];
    return `បណ្ណត្រឡប់ទំនិញ #${m[1]} ${action}។`;
  }

  m = text.match(/^Purchase item #(.+) (created|updated) for Purchase #(.+)\.$/i);
  if (m) {
    const action = m[2].toLowerCase() === "created" ? "បានបង្កើត" : "បានកែប្រែ";
    return `ទំនិញ #${m[1]} ក្នុងការទិញ #${m[3]} ${action}។`;
  }

  m = text.match(/^Purchase item #(.+) deleted from Purchase #(.+)\.$/i);
  if (m) return `ទំនិញ #${m[1]} ត្រូវបានលុបចេញពីការទិញ #${m[2]}។`;

  m = text.match(/^Purchase return item #(.+) (created|updated) for Purchase return #(.+)\.$/i);
  if (m) {
    const action = m[2].toLowerCase() === "created" ? "បានបង្កើត" : "បានកែប្រែ";
    return `ទំនិញត្រឡប់ #${m[1]} ក្នុងបណ្ណត្រឡប់ #${m[3]} ${action}។`;
  }

  m = text.match(/^Purchase return item #(.+) deleted from Purchase return #(.+)\.$/i);
  if (m) return `ទំនិញត្រឡប់ #${m[1]} ត្រូវបានលុបចេញពីបណ្ណត្រឡប់ #${m[2]}។`;

  // Product "X" created/updated/deleted.
  m = text.match(/^Product "(.+)" (created|updated|deleted)\.$/i);
  if (m) return `ផលិតផល "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // Category "X" created/updated/deleted.
  m = text.match(/^Categor\w+ "(.+)" (created|updated|deleted)\.$/i);
  if (m) return `ប្រភេទ "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // N product(s) deleted.
  m = text.match(/^(\d+) products? deleted\.$/i);
  if (m) return `ផលិតផលចំនួន ${m[1]} ត្រូវបានលុប។`;

  // Product "X" created with variants. — must come before the generic Product "X" created/
  // updated/deleted match below, since that one requires the string to end right after the verb.
  m = text.match(/^Product "(.+)" created with variants\.$/i);
  if (m) return `ផលិតផល "${m[1]}" បានបង្កើតជាមួយម៉ូដែល។`;

  // N categor(y|ies) deleted.
  m = text.match(/^(\d+) categor(?:y|ies) deleted\.$/i);
  if (m) return `ប្រភេទចំនួន ${m[1]} ត្រូវបានលុប។`;

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

  // Sales return #X updated/deleted/approved/rejected/completed for Sale #Y.
  m = text.match(/^Sales return #(.+) (updated|deleted|approved|rejected|completed) for Sale #(.+)\.$/i);
  if (m) {
    const action = { updated: "បានកែប្រែ", deleted: "បានលុប", approved: "បានអនុម័ត", rejected: "បានបដិសេធ", completed: "បានបញ្ចប់" }[m[2].toLowerCase()];
    return `បណ្ណត្រឡប់ការលក់ #${m[1]} ${action} សម្រាប់វិក្កយបត្រ #${m[3]}។`;
  }

  // Refund of X CURRENCY recorded for Sales return #Y.
  m = text.match(/^Refund of (.+) (USD|KHR) recorded for Sales return #(.+)\.$/i);
  if (m) return `បានកត់ត្រាការសងប្រាក់ ${m[1]} ${m[2]} សម្រាប់បណ្ណត្រឡប់ការលក់ #${m[3]}។`;

  // Sales return #X resolved (approve/complete[/refund]) for Sale #Y. — the atomic "resolve"
  // action from the pending-approval queue, added alongside the other Sales return descriptions
  // but originally missed here (see project_pending_returns_tab_filters / today's audit-log gap).
  m = text.match(/^Sales return #(.+) resolved \(approve\/complete(\/refund)?\) for Sale #(.+)\.$/i);
  if (m) {
    const steps = m[2] ? "បានអនុម័ត បញ្ចប់ និងសងប្រាក់" : "បានអនុម័ត និងបញ្ចប់";
    return `បណ្ណត្រឡប់ការលក់ #${m[1]} ${steps} សម្រាប់វិក្កយបត្រ #${m[3]}។`;
  }

  // User "X" status changed.
  m = text.match(/^User "(.+)" status changed\.$/i);
  if (m) return `ស្ថានភាពរបស់អ្នកប្រើ "${m[1]}" ត្រូវបានផ្លាស់ប្តូរ។`;

  // Password reset for user "X".
  m = text.match(/^Password reset for user "(.+)"\.$/i);
  if (m) return `លេខសម្ងាត់របស់អ្នកប្រើ "${m[1]}" ត្រូវបានកំណត់ឡើងវិញ។`;

  // Role "X" created/updated/deleted.
  m = text.match(/^Role "(.+)" (created|updated|deleted)\.$/i);
  if (m) return `តួនាទី "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // Permissions updated for role "X".
  m = text.match(/^Permissions updated for role "(.+)"\.$/i);
  if (m) return `សិទ្ធិប្រើប្រាស់សម្រាប់តួនាទី "${m[1]}" ត្រូវបានកែប្រែ។`;

  // Exchange rate created/updated/deleted: 1 USD = Y KHR.
  m = text.match(/^Exchange rate (created|updated|deleted):\s*1 USD = (.+) KHR\.$/i);
  if (m) return `អត្រាប្តូរប្រាក់ ${ACTION_LABELS[m[1].toLowerCase()] ?? m[1]}៖ 1 USD = ${m[2]} KHR។`;

  // Price rule created/updated/deleted: $X (Y). — Y is applies_to (retail/wholesale/both),
  // already in AUDIT_VALUE_LABELS but this branch was showing it raw instead of translating it.
  m = text.match(/^Price rule (created|updated|deleted):\s*\$(.+) \((.+)\)\.$/i);
  if (m) {
    const appliesTo = AUDIT_VALUE_LABELS[m[3].toLowerCase()] ?? m[3];
    return `កម្រិតតម្លៃ ${ACTION_LABELS[m[1].toLowerCase()] ?? m[1]}៖ $${m[2]} (${appliesTo})។`;
  }

  // Backup "X" created/deleted.
  m = text.match(/^Backup "(.+)" (created|deleted)\.$/i);
  if (m) return `ទិន្នន័យបម្រុងទុក "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // Backup "X" downloaded.
  m = text.match(/^Backup "(.+)" downloaded\.$/i);
  if (m) return `ទិន្នន័យបម្រុងទុក "${m[1]}" ត្រូវបានទាញយក។`;

  // System restored from uploaded backup file "X". / System restored from backup "X".
  m = text.match(/^System restored from uploaded backup file "(.+)"\.$/i);
  if (m) return `ប្រព័ន្ធត្រូវបានស្តារឡើងវិញពីឯកសារបម្រុងទុកដែលបានផ្ទុកឡើង "${m[1]}"។`;

  m = text.match(/^System restored from backup "(.+)"\.$/i);
  if (m) return `ប្រព័ន្ធត្រូវបានស្តារឡើងវិញពីទិន្នន័យបម្រុងទុក "${m[1]}"។`;

  // Customer "X" created/updated/deleted.
  m = text.match(/^Customer "(.+)" (created|updated|deleted)\.$/i);
  if (m) return `អតិថិជន "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // N customer(s) deleted.
  m = text.match(/^(\d+) customers? deleted\.$/i);
  if (m) return `អតិថិជនចំនួន ${m[1]} នាក់ ត្រូវបានលុប។`;

  // Supplier "X" created/updated/deleted.
  m = text.match(/^Supplier "(.+)" (created|updated|deleted)\.$/i);
  if (m) return `អ្នកផ្គត់ផ្គង់ "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // N supplier(s) deleted.
  m = text.match(/^(\d+) suppliers? deleted\.$/i);
  if (m) return `អ្នកផ្គត់ផ្គង់ចំនួន ${m[1]} ត្រូវបានលុប។`;

  // Unit "X" (Y) created/updated/deleted.
  m = text.match(/^Unit "(.+)" \((.+)\) (created|updated|deleted)\.$/i);
  if (m) return `ខ្នាតទំនិញ "${m[1]}" (${m[2]}) ${ACTION_LABELS[m[3].toLowerCase()] ?? m[3]}។`;

  // Stock balance created/updated/deleted for product variant #X...
  m = text.match(/^Stock balance (created|updated) for product variant #(\d+):\s*(.+) on hand\.$/i);
  if (m) return `សមតុល្យស្តុកសម្រាប់ម៉ូដែលផលិតផល #${m[2]} ${ACTION_LABELS[m[1].toLowerCase()] ?? m[1]}៖ នៅសល់ ${m[3]}។`;

  m = text.match(/^Stock balance deleted for product variant #(\d+)\.$/i);
  if (m) return `សមតុល្យស្តុកសម្រាប់ម៉ូដែលផលិតផល #${m[1]} ត្រូវបានលុប។`;

  // Inventory batch "X" created for product variant #Y.
  m = text.match(/^Inventory batch "(.+)" created for product variant #(\d+)\.$/i);
  if (m) return `ជុំស្តុក "${m[1]}" បានបង្កើតសម្រាប់ម៉ូដែលផលិតផល #${m[2]}។`;

  // Inventory batch "X" updated/deleted.
  m = text.match(/^Inventory batch "(.+)" (updated|deleted)\.$/i);
  if (m) return `ជុំស្តុក "${m[1]}" ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  // Product variant "X" (Y) created/updated/deleted.
  m = text.match(/^Product variant "(.+)" \((.+)\) (created|updated|deleted)\.$/i);
  if (m) return `ម៉ូដែលផលិតផល "${m[1]}" (${m[2]}) ${ACTION_LABELS[m[3].toLowerCase()] ?? m[3]}។`;

  // Product variant unit created for variant #X (conversion: Y).
  m = text.match(/^Product variant unit created for variant #(\d+) \(conversion:\s*(.+)\)\.$/i);
  if (m) return `ឯកតាម៉ូដែលផលិតផល បានបង្កើតសម្រាប់ម៉ូដែល #${m[1]} (អត្រាបំលែង: ${m[2]})។`;

  // Product variant unit #X updated (conversion: Y).
  m = text.match(/^Product variant unit #(\d+) updated \(conversion:\s*(.+)\)\.$/i);
  if (m) return `ឯកតាម៉ូដែលផលិតផល #${m[1]} បានកែប្រែ (អត្រាបំលែង: ${m[2]})។`;

  // Product variant unit #X deleted for variant #Y.
  m = text.match(/^Product variant unit #(\d+) deleted for variant #(\d+)\.$/i);
  if (m) return `ឯកតាម៉ូដែលផលិតផល #${m[1]} ត្រូវបានលុបចេញពីម៉ូដែល #${m[2]}។`;

  // Stock movement created for product variant #X: TYPE QTY.
  m = text.match(/^Stock movement created for product variant #(\d+):\s*(\S+)\s+(.+)\.$/i);
  if (m) {
    const typeLabel = AUDIT_VALUE_LABELS[m[2].toLowerCase()] ?? m[2];
    return `ចលនាស្តុកបានបង្កើតសម្រាប់ម៉ូដែលផលិតផល #${m[1]}៖ ${typeLabel} ${m[3]}។`;
  }

  // Stock movement #X updated for product variant #Y.
  m = text.match(/^Stock movement #(\d+) updated for product variant #(\d+)\.$/i);
  if (m) return `ចលនាស្តុក #${m[1]} បានកែប្រែសម្រាប់ម៉ូដែលផលិតផល #${m[2]}។`;

  // Generic: X created/updated/deleted.
  m = text.match(/^(.+)\s(created|updated|deleted|cancelled|restored)\.$/ );
  if (m) return `${m[1]} ${ACTION_LABELS[m[2].toLowerCase()] ?? m[2]}។`;

  return text;
}
