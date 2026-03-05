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
      await get().fetchMe();
      set({ isAuthenticated: true });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.detail || "Xatolik yuz berdi" };
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
      return { success: false, message: err.response?.data?.detail || "Xatolik yuz berdi" };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res = await authAPI.getMe();
      set({ user: res.data });
    } catch {
      localStorage.clear();
      set({ isAuthenticated: false });
    }
  },

  updateMe: async (data) => {
    try {
      const res = await authAPI.updateMe(data);
      set({ user: res.data });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.detail || "Xatolik" };
    }
  },
}));

export default useAuthStore;