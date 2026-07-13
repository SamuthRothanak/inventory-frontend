export function normalizeCategoryStatus(value) {
  if (value === true || value === 1 || value === "1") return "Active";
  if (value === false || value === 0 || value === "0") return "Inactive";

  const normalized = String(value || "").toLowerCase();

  if (normalized === "active") return "Active";
  if (normalized === "inactive") return "Inactive";

  return "Inactive";
}

export function extractCategories(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function normalizeDateTimeValue(value) {
  if (!value) return "";

  return String(value).replace("T", " ").replace(/\.\d+Z?$/, "").slice(0, 16);
}

function normalizeComparableDateTime(value) {
  return normalizeDateTimeValue(value).replace(/\D/g, "");
}

export function normalizeCategory(item) {
  const createdAtRaw = item.created_at || item.createdAt || "";
  const updatedAtRaw = item.updated_at || item.updatedAt || "";
  const createdComparable = normalizeComparableDateTime(createdAtRaw);
  const updatedComparable = normalizeComparableDateTime(updatedAtRaw);
  const hasBeenUpdated = Boolean(
    createdComparable &&
      updatedComparable &&
      updatedComparable !== createdComparable
  );

  return {
    id: item.id,
    name: item.name || "",
    description: item.description || "",
    imagePath: item.image || item.imagePath || "",
    imageFile: null,
    status: normalizeCategoryStatus(item.status),
    createdAt: normalizeDateTimeValue(createdAtRaw) || "-",
    updatedAt: normalizeDateTimeValue(updatedAtRaw) || "-",
    hasBeenUpdated,
    raw: item,
  };
}

export function filterCategories(categories, searchTerm, statusFilter) {
  const search = String(searchTerm || "").toLowerCase().trim();

  return categories.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}
