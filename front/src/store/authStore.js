import { create } from "zustand";
import { authAPI } from "../api";

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem("access_token"),

  login: async (phone, password) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login(phone, password);
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("refresh_token", res.data.refresh_token);
      set({ isAuthenticated: true });
      // fetchMe ni background da chaqiramiz — login ni bloklamaydi
      await get().fetchMe().catch(() => {});
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.detail || "Xatolik" };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      await authAPI.register(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.detail || "Xatolik" };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    try {
      const res = await authAPI.getMe();
      set({ user: res.data, isAuthenticated: true });
    } catch (err) {
      // Faqat 401 da logout qilamiz, boshqa xatolarda (network, 500) token saqlab qolamiz
      if (err.response?.status === 401) {
        set({ user: null, isAuthenticated: false });
        localStorage.clear();
      }
    }
  },

  updateMe: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.updateMe(data);
      set({ user: res.data });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.detail || "Xatolik" };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
