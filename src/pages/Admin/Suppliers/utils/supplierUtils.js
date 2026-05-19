export const formatDate = (value) => {
  if (!value) return "-";
  return String(value).slice(0, 10);
};

export const getStatusLabel = (status) => {
  const normalizedStatus = String(status).toLowerCase();

  return status === true ||
    status === 1 ||
    status === "1" ||
    normalizedStatus === "active"
    ? "Active"
    : "Inactive";
};

export const normalizeSupplier = (item) => {
  return {
    id: item.id,
    supplierCode: item.supplier_code || item.supplierCode || "-",
    name: item.name || "",
    contactPerson: item.contact_person || item.contactPerson || "",
    phone: item.phone || "",
    email: item.email || "",
    address: item.address || "",
    note: item.note || item.description || "",
    status: getStatusLabel(item.status),
    createdAt: formatDate(item.created_at || item.createdAt),
    updatedAt: formatDate(item.updated_at || item.updatedAt),
  };
};

export const extractSuppliers = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data.map(normalizeSupplier);
  }

  if (Array.isArray(data?.data)) {
    return data.data.map(normalizeSupplier);
  }

  if (Array.isArray(response)) {
    return response.map(normalizeSupplier);
  }

  return [];
};

export const filterSuppliers = (suppliers, searchTerm, statusFilter) => {
  const search = searchTerm.toLowerCase();

  return suppliers.filter((item) => {
    const matchesSearch =
      item.supplierCode.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search) ||
      item.contactPerson.toLowerCase().includes(search) ||
      item.phone.toLowerCase().includes(search) ||
      item.email.toLowerCase().includes(search) ||
      item.address.toLowerCase().includes(search) ||
      item.note.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
};

export const toSupplierPayload = (form) => {
  return {
    name: form.name.trim(),
    contact_person: form.contactPerson?.trim() || "",
    phone: form.phone?.trim() || "",
    email: form.email?.trim() || "",
    address: form.address?.trim() || "",
    note: form.note?.trim() || "",
    status: form.status === "Active" ? "active" : "inactive",
  };
};