export function extractApiData(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;

  if (response?.data && typeof response.data === "object" && response.data.id) {
    return [response.data];
  }

  return [];
}
