import { extractApiData } from "./productHelpers";

export function extractActiveRate(response) {
  const empty = { rate: 0, rounding: "ceil" };

  if (!response || response?.success === false) return empty;

  const list = extractApiData(response);

  if (!Array.isArray(list) || list.length === 0) return empty;

  const activeRecords = list.filter((item) => {
    const status = String(item.status ?? "").toLowerCase();
    return status === "active" || item.status === 1 || item.status === true;
  });

  const pool = activeRecords.length > 0 ? activeRecords : list;

  const sorted = [...pool].sort((a, b) => {
    const dateA = new Date(a.rate_date || a.rateDate || 0).getTime();
    const dateB = new Date(b.rate_date || b.rateDate || 0).getTime();

    if (dateB !== dateA) return dateB - dateA;

    return Number(b.id || 0) - Number(a.id || 0);
  });

  const chosen = sorted[0];

  if (!chosen) return empty;

  const rate =
    chosen.usd_to_khr_rate ?? chosen.usdToKhrRate ?? chosen.rate ?? null;

  const num = Number(rate);
  const rounding = chosen.khr_rounding || chosen.khrRounding || "ceil";

  return {
    rate: Number.isFinite(num) && num > 0 ? num : 0,
    rounding,
  };
}
