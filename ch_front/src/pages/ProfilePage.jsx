import { useState, useRef, useEffect } from "react";
import useAuthStore from "../store/authStore";
import { authAPI, avatarAPI } from "../api";
import { User, Phone, Lock, Camera, Loader, Check, Crown, Eye, EyeOff } from "lucide-react";

const BASE_URL = "http://localhost:8000";

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [tab, setTab] = useState("info");
  const [infoForm, setInfoForm] = useState({ full_name: user?.full_name || "" });
  const [passForm, setPassForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileRef = useRef();

  // user o'zgarganda formni yangilash
  useEffect(() => {
    setInfoForm({ full_name: user?.full_name || "" });
  }, [user]);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInfoSave = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await authAPI.updateMe(infoForm);
      await fetchMe();
      showMsg("Ma'lumotlar saqlandi!");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "error"); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) {
      showMsg("Parollar mos kelmaydi", "error"); return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword(passForm);
      setPassForm({ old_password: "", new_password: "", confirm_password: "" });
      showMsg("Parol o'zgartirildi!");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "error"); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { showMsg("Fayl 5MB dan katta bo'lmasin!", "error"); return; }
    setAvatarLoading(true);
    try {
      await avatarAPI.upload(user.id, file);
      await fetchMe(); // store yangilanadi, avatar ko'rinadi
      showMsg("Avatar yangilandi!");
    } catch (err) { showMsg(err.response?.data?.detail || "Avatar yuklashda xatolik", "error"); }
    finally {
      setAvatarLoading(false);
      e.target.value = ""; // reset input
    }
  };

  const isPremium = user?.role === "PREMIUM" || user?.role === "ADMIN";

  // Avatar URL
  const avatarUrl = user?.avatar?.photo_url
    ? `${BASE_URL}${user.avatar.photo_url}?t=${Date.now()}`
    : null;

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", padding: "13px 16px", fontSize: "14px", color: "white",
    outline: "none", boxSizing: "border-box", fontWeight: 500, transition: "border-color 0.2s",
  };
  const labelStyle = {
    display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.45)",
    marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase",
  };

  return (
    <div style={{ maxWidth: "560px" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "24px" }}>Profil</h1>

      {/* Avatar card */}
      <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "18px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 8px 24px rgba(99,102,241,0.35)" }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <span style={{ fontSize: "28px", fontWeight: 800, color: "white" }}>
                {user?.full_name?.[0]?.toUpperCase() || "U"}
              </span>
            )}
            {/* Upload loading overlay */}
            {avatarLoading && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "18px" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            style={{ position: "absolute", bottom: "-6px", right: "-6px", width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "2px solid #070712", display: "flex", alignItems: "center", justifyContent: "center", cursor: avatarLoading ? "not-allowed" : "pointer" }}
          >
            <Camera size={13} color="white" />
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleAvatarUpload} />
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "18px", fontWeight: 800, color: "white", marginBottom: "4px" }}>{user?.full_name}</p>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>{user?.phone_number}</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", padding: "3px 10px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "999px", color: "#a5b4fc", fontWeight: 600 }}>
              {user?.role || "USER"}
            </span>
            {isPremium && (
              <span style={{ fontSize: "11px", padding: "3px 10px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "999px", color: "#fbbf24", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <Crown size={10} /> Premium
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: message.type === "success" ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: "8px" }}>
          {message.type === "success" ? <Check size={15} /> : "⚠"}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "4px", marginBottom: "16px" }}>
        {[{ key: "info", label: "Ma'lumotlar" }, { key: "password", label: "Parol o'zgartirish" }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "all 0.2s", background: tab === key ? "rgba(99,102,241,0.2)" : "transparent", color: tab === key ? "#a5b4fc" : "rgba(255,255,255,0.4)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px" }}>
        {tab === "info" ? (
          <form onSubmit={handleInfoSave} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={labelStyle}>To'liq ism</label>
              <div style={{ position: "relative" }}>
                <User size={15} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="text" value={infoForm.full_name} onChange={e => setInfoForm({ full_name: e.target.value })} style={{ ...inputStyle, paddingLeft: "42px" }} required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Telefon raqam</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} color="rgba(255,255,255,0.15)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="text" value={user?.phone_number || ""} disabled style={{ ...inputStyle, paddingLeft: "42px", opacity: 0.4, cursor: "not-allowed" }} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: 700, color: "white", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.3)", opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={15} />}
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {[
              { key: "old_password", label: "Joriy parol", show: showOld, toggle: () => setShowOld(!showOld) },
              { key: "new_password", label: "Yangi parol", show: showNew, toggle: () => setShowNew(!showNew) },
              { key: "confirm_password", label: "Yangi parolni tasdiqlang", show: showNew, toggle: () => setShowNew(!showNew) },
            ].map(({ key, label, show, toggle }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input type={show ? "text" : "password"} value={passForm[key]} onChange={e => setPassForm({ ...passForm, [key]: e.target.value })} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: "42px", paddingRight: "42px" }} required />
                  <button type="button" onClick={toggle} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)" }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: 700, color: "white", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={15} />}
              {loading ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
            </button>
          </form>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}