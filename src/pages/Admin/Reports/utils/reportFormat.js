export const fmtUsd  = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtKhr  = (n) => `${Math.round(Number(n || 0)).toLocaleString("en-US")}`;

export const fmtHourLabel = (value) => {
  const hour = Number.parseInt(String(value).split(":")[0], 10);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return value;
  if (hour === 0) return "12 អធ្រាត្រ";
  if (hour < 12) return `${hour} ព្រឹក`;
  if (hour === 12) return "12 ថ្ងៃត្រង់";
  if (hour < 17) return `${hour - 12} រសៀល`;
  if (hour < 20) return `${hour - 12} ល្ងាច`;
  return `${hour - 12} យប់`;
};

export const fmtHourRangeLabel = (value) => {
  const hour = Number.parseInt(String(value).split(":")[0], 10);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return value;

  const start = String(hour).padStart(2, "0");
  return `${fmtHourLabel(value)} (${start}:00–${start}:59)`;
};

export const fmtCompactUsd = (value) => {
  const amount = Number(value ?? 0);

  if (Math.abs(amount) >= 1_000_000) {
    return `$${Number((amount / 1_000_000).toFixed(1))}M`;
  }

  if (Math.abs(amount) >= 1_000) {
    return `$${Number((amount / 1_000).toFixed(1))}k`;
  }

  return `$${Number(amount.toFixed(2)).toLocaleString("en-US")}`;
};

export const buildMoneyChartScale = (rows = []) => {
  const highestValue = rows.reduce((highest, row) => Math.max(
    highest,
    Number(row?.sales ?? 0),
    Number(row?.purchases ?? 0),
    Number(row?.returns ?? 0),
  ), 0);

  if (highestValue <= 0) {
    return { max: 100, ticks: [0, 25, 50, 75, 100] };
  }

  const roughStep = highestValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const multiplier = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  const step = multiplier * magnitude;
  let max = Math.ceil(highestValue / step) * step;

  if (max < highestValue * 1.1) {
    max += step;
  }

  return {
    max,
    ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, index) => index * step),
  };
};

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


