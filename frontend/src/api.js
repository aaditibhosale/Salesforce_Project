const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  loginUrl: () => `${API_URL}/auth/login`,
  authStatus: () => request("/auth/status"),
  logout: () => request("/auth/logout", { method: "POST" }),

  describe: (object) => request(`/api/describe/${object}`),
  listRecords: (object, offset, limit = 20) =>
    request(`/api/records/${object}?offset=${offset}&limit=${limit}`),
  createRecord: (object, fields) =>
    request(`/api/records/${object}`, { method: "POST", body: JSON.stringify(fields) }),
  updateRecord: (object, id, fields) =>
    request(`/api/records/${object}/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
  deleteRecord: (object, id) =>
    request(`/api/records/${object}/${id}`, { method: "DELETE" }),
};
