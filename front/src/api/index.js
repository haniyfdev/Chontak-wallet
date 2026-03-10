import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://chontak-wallet.onrender.com/api";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.method === "post") {
    config.headers["Idempotency-Key"] = crypto.randomUUID();
  }
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

// ===== AUTH =====
export const authAPI = {
  register:       (data) => api.post("/auth/register", data),
  login:          (phone, password) => {
    const form = new URLSearchParams();
    form.append("username", phone);
    form.append("password", password);
    return api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  refresh:        (refresh_token) => api.post("/auth/refresh", { refresh_token }),
  logout:         () => api.post("/auth/logout"),
  getMe:          () => api.get("/auth/me"),
  updateMe:       (data) => api.patch("/auth/me", data),
  changePassword: (data) => api.patch("/auth/change-password", data),
};

// ===== CARD =====
export const cardAPI = {
  create:   () => api.post("/card/"),
  getAll:   () => api.get("/card/"),
  getOne:   (id) => api.get(`/card/${id}`),
  freeze:   (id) => api.patch(`/card/${id}/freeze`, {}),
  unfreeze: (id) => api.patch(`/card/${id}/unfreeze`, {}),
};

// ===== TRANSACTION =====
export const transactionAPI = {
  send:   (data) => api.post("/transactions/", data),
  getAll: (params) => api.get("/transactions/", { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
};

// ===== SAVED CARD =====
export const savedCardAPI = {
  save:        (data) => api.post("/saved-card/", data),
  getAll:      (params) => api.get("/saved-card/", { params }),
  getOne:      (id) => api.get(`/saved-card/${id}`),
  updateAlias: (id, data) => api.patch(`/saved-card/${id}`, data),
  delete:      (id) => api.delete(`/saved-card/${id}`),
};

// ===== SUBSCRIPTION =====
export const subscriptionAPI = {
  subscribe: (cardId) => api.post(`/subscription/${cardId}`),
  getByCard: (cardId) => api.get(`/subscription/${cardId}`),
};

// ===== AVATAR =====
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

// ===== ADMIN =====
export const adminAPI = {
  deposit:           (data) => api.post("/admin/deposit", data),
  getPlatformCard:   () => api.get("/admin/platform-card"),
  getAllUsers:        (params) => api.get("/admin/all-users", { params }),
  getOneUser:        (userId) => api.get(`/admin/one-users/${userId}`),
  updateUserRole:    (userId, action) => api.patch(`/admin/user-role/${userId}`, { action }, { params: { action } }),
  getAllCards:        (params) => api.get("/admin/all-cards", { params }),
  getOneCard:        (cardId) => api.get(`/admin/one-card/${cardId}`),
  updateCardStatus:  (cardId, status) => api.patch(`/admin/status-card/${cardId}`, { status }, { params: { status } }),
  getAllTransactions: (params) => api.get("/admin/all-transactions", { params }),
  getOneTransaction: (txId) => api.get("/admin/one-transaction", { params: { transaction_id: txId } }),
  verifyAllBalances: (params) => api.get("/admin/verify-all-balance", { params }),
  verifyOneBalance:  (cardId) => api.get(`/admin/verify_balance/${cardId}`),
  getDashboard:      (calendar) => api.get("/admin/dashboard", { params: calendar ? { calendar } : {} }),
};

export default api;
