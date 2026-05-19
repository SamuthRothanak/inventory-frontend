export const getCategoryListFromResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

export const mapCategoryToForm = (category) => {
  return {
    name: category?.name || "",
    description: category?.description || "",
    status: Boolean(category?.status),
    image: undefined,
  };
};

export const emptyCategoryForm = {
  name: "",
  description: "",
  status: true,
  image: undefined,
};