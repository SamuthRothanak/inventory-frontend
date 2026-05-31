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

export function normalizeCategory(item) {
  return {
    id: item.id,
    name: item.name || "",
    description: item.description || "",
    imagePath: item.image || item.imagePath || "",
    imageFile: null,
    status: normalizeCategoryStatus(item.status),
    createdAt: item.created_at ? item.created_at.slice(0, 10) : "-",
    updatedAt: item.updated_at
      ? item.updated_at.slice(0, 10)
      : item.created_at
        ? item.created_at.slice(0, 10)
        : "-",
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