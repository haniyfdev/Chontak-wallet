import axios from "axios";

const BASE_URL = "http://localhost:8000/api";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh_token = localStorage.getItem("refresh_token");
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token });
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("refresh_token", res.data.refresh_token);
        original.headers.Authorization = `Bearer ${res.data.access_token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (phone, password) => {
    const form = new URLSearchParams();
    form.append("username", phone);
    form.append("password", password);
    return api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateMe: (data) => api.patch("/auth/me", data),
  changePassword: (data) => api.patch("/auth/change-password", data),
};

export const cardAPI = {
  create: () => api.post("/card/"),
  getAll: () => api.get("/card/"),
  getOne: (id) => api.get(`/card/${id}`),
  freeze: (id) => api.patch(`/card/${id}/freeze`),
  unfreeze: (id) => api.patch(`/card/${id}/unfreeze`),
};

export const transactionAPI = {
  send: (data) => api.post("/transactions/", data),
  getAll: (params) => api.get("/transactions/", { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
};

export const savedCardAPI = {
  save: (data) => api.post("/saved-card/", data),
  getAll: (params) => api.get("/saved-card/", { params }),
  getOne: (id) => api.get(`/saved-card/${id}`),
  updateAlias: (id, data) => api.patch(`/saved-card/${id}`, data),
  delete: (id) => api.delete(`/saved-card/${id}`),
};

export const subscriptionAPI = {
  subscribe: (cardId) => api.post(`/subscription/${cardId}`),
  get: (cardId) => api.get(`/subscription/${cardId}`),
};

export const avatarAPI = {
  upload: (userId, file) => {
    const form = new FormData();
    form.append("image", file);
    return api.post(`/avatar/${userId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete: (userId) => api.delete(`/avatar/${userId}`),
};

export default api;