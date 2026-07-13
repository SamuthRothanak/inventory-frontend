const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseDateOnly = (value) => {
  if (!value || value === "-") return null;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

export function getExpiryInfo(expiredDate, warningDays = 30) {
  const expiry = parseDateOnly(expiredDate);
  if (!expiry) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = Math.round((expiry.getTime() - today.getTime()) / MS_PER_DAY);

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      label: "ផុតកំណត់ហើយ",
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
      shouldWarn: true,
    };
  }

  if (daysRemaining === 0) {
    return {
      daysRemaining,
      label: "ផុតកំណត់ថ្ងៃនេះ",
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
      shouldWarn: true,
    };
  }

  if (daysRemaining === 1) {
    return {
      daysRemaining,
      label: "ផុតកំណត់ស្អែក",
      className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      shouldWarn: true,
    };
  }

  return {
    daysRemaining,
    label: `នៅសល់ ${daysRemaining} ថ្ងៃ`,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    shouldWarn: daysRemaining <= warningDays,
  };
}

export function getNearestExpiryInfo(batches = [], warningDays = 30) {
  return batches
    .filter((batch) => Number(batch?.qtyRemainingBase || 0) > 0)
    .map((batch) => ({ batch, info: getExpiryInfo(batch?.expiredDate, warningDays) }))
    .filter((entry) => entry.info)
    .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining)[0] || null;
}
