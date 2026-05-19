export const formatDate = (value) => {
  if (!value) return "-";
  return String(value).slice(0, 10);
};

export const getStatusLabel = (status) => {
  return status === true ||
    status === 1 ||
    status === "1" ||
    status === "Active"
    ? "Active"
    : "Inactive";
};

export const normalizeCustomer = (item) => {
  return {
    id: item.id,
    customerCode: item.customer_code || item.customerCode || "-",
    shopName: item.shop_name || item.shopName || "",
    contactName: item.contact_name || item.contactName || "",
    phone: item.phone || "",
    address: item.address || "",
    note: item.description || item.note || "",
    status: getStatusLabel(item.status),
    createdAt: formatDate(item.created_at || item.createdAt),
    updatedAt: formatDate(item.updated_at || item.updatedAt),
  };
};

export const extractCustomers = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data.map(normalizeCustomer);
  }

  if (Array.isArray(data?.data)) {
    return data.data.map(normalizeCustomer);
  }

  if (Array.isArray(response)) {
    return response.map(normalizeCustomer);
  }

  return [];
};

export const filterCustomers = (customers, searchTerm, statusFilter) => {
  const search = searchTerm.toLowerCase();

  return customers.filter((item) => {
    const matchesSearch =
      item.customerCode.toLowerCase().includes(search) ||
      item.shopName.toLowerCase().includes(search) ||
      item.contactName.toLowerCase().includes(search) ||
      item.phone.toLowerCase().includes(search) ||
      item.address.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
};

export const toCustomerPayload = (form) => {
  return {
    shop_name: form.shopName.trim(),
    contact_name: form.contactName?.trim() || "",
    phone: form.phone?.trim() || "",
    address: form.address?.trim() || "",
    description: form.note?.trim() || "",
    status: form.status === "Active",
  };
};