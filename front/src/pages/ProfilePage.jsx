import { useEffect, useState, useRef } from "react";
import { authAPI, avatarAPI } from "../api";
import useAuthStore from "../store/authStore";
import { User, Lock, Camera, Eye, EyeOff, Loader, Check, X, Crown } from "lucide-react";

const BASE_URL = "https://chontak-wallet.onrender.com";

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [tab, setTab] = useState("info");
  const [info, setInfo] = useState({ full_name: "" });
  const [passwords, setPasswords] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [shows, setShows] = useState({ old: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const fileRef = useRef();

  useEffect(() => {
    if (user) setInfo({ full_name: user.full_name || "" });
  }, [user]);

  const showMsg = (text, type = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg("Rasm 5MB dan katta bo'lmasin", "err"); return; }
    setUploading(true);
    try {
      await avatarAPI.upload(user.id, file);
      await fetchMe();
      showMsg("Avatar yangilandi! ✅");
    } catch (err) { showMsg(err.response?.data?.detail || "Yuklashda xatolik", "err"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleAvatarDelete = async () => {
    if (!user?.avatar?.photo_url) return;
    setUploading(true);
    try {
      await avatarAPI.delete(user.id);
      await fetchMe();
      showMsg("Avatar o'chirildi");
    } catch (err) { showMsg(err.response?.data?.detail || "O'chirishda xatolik", "err"); }
    finally { setUploading(false); }
  };

  const handleSaveInfo = async () => {
    if (!info.full_name.trim()) { showMsg("Ism familiya kiriting", "err"); return; }
    setSaving(true);
    try {
      await authAPI.updateMe({ full_name: info.full_name });
      await fetchMe();
      showMsg("Ma'lumotlar saqlandi! ✅");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "err"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passwords.old_password) { showMsg("Eski parolni kiriting", "err"); return; }
    if (passwords.new_password.length < 6) { showMsg("Yangi parol kamida 6 ta belgi", "err"); return; }
    if (passwords.new_password !== passwords.confirm_password) { showMsg("Parollar mos kelmadi", "err"); return; }
    setSaving(true);
    try {
      await authAPI.changePassword(passwords);
      setPasswords({ old_password: "", new_password: "", confirm_password: "" });
      showMsg("Parol muvaffaqiyatli o'zgartirildi! ✅");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "err"); }
    finally { setSaving(false); }
  };

  const avatarUrl = user?.avatar?.photo_url ? `${BASE_URL}${user.avatar.photo_url}?t=${Date.now()}` : null;
  const initials = user?.full_name?.[0]?.toUpperCase() || "U";
  const isPremium = user?.role === "PREMIUM" || user?.role === "ADMIN";

  const iStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "13px 16px", fontSize: "14px", color: "white", outline: "none", boxSizing: "border-box" };
  const lStyle = { display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.38)", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" };

  return (
    <div style={{ maxWidth: "1100px" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "24px" }}>Profil sozlamalari</h1>

      {/* Avatar section */}
      <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "22px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "28px", fontWeight: 700, color: "white", border: "3px solid rgba(99,102,241,0.3)" }}>
            {avatarUrl ? <img src={avatarUrl} alt="av" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : initials}
          </div>
          {uploading && (
            <div style={{ position: "absolute", inset: 0, borderRadius: "22px", background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader size={20} color="white" style={{ animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "2px solid #0D0D22", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer" }}>
            <Camera size={13} color="white" />
          </button>
          {avatarUrl && (
            <button onClick={handleAvatarDelete} disabled={uploading}
              title="Avatarni o'chirish"
              style={{ position: "absolute", top: "-4px", right: "-4px", width: "24px", height: "24px", borderRadius: "6px", background: "rgba(239,68,68,0.9)", border: "2px solid #0D0D22", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "not-allowed" : "pointer" }}>
              <X size={11} color="white" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} style={{ display: "none" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "18px", fontWeight: 800, color: "white", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.full_name}
          </p>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>{user?.phone_number}</p>
          {isPremium && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "999px" }}>
              <Crown size={11} color="#fbbf24" />
              <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 600 }}>{user?.role === "ADMIN" ? "Admin" : "Premium"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{ background: msg.type === "err" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${msg.type === "err" ? "rgba(239,68,68,0.22)" : "rgba(16,185,129,0.22)"}`, borderRadius: "12px", padding: "11px 15px", marginBottom: "16px", fontSize: "13px", color: msg.type === "err" ? "#f87171" : "#4ade80", display: "flex", alignItems: "center", gap: "8px" }}>
          {msg.type === "err" ? <X size={14} /> : <Check size={14} />} {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "4px", marginBottom: "20px" }}>
        {[["info", User, "Ma'lumotlar"], ["password", Lock, "Parol"]].map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", padding: "10px", borderRadius: "11px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, background: tab === key ? "#0D0D22" : "transparent", color: tab === key ? "white" : "rgba(255,255,255,0.38)", boxShadow: tab === key ? "0 2px 8px rgba(0,0,0,0.3)" : "none", transition: "all 0.2s" }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === "info" && (
        <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={lStyle}>Ism Familiya</label>
            <input type="text" value={info.full_name} onChange={e => setInfo({ full_name: e.target.value })} style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>Telefon raqam</label>
            <input type="text" value={user?.phone_number || ""} disabled
              style={{ ...iStyle, color: "rgba(255,255,255,0.35)", cursor: "not-allowed" }} />
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", marginTop: "5px" }}>Telefon raqamni o'zgartirib bo'lmaydi</p>
          </div>
          <button onClick={handleSaveInfo} disabled={saving}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", width: "100%", background: saving ? "rgba(99,102,241,0.4)" : "linear-gradient(90deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: 700, color: "white", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? <Loader size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={15} />}
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      )}

      {/* Password tab */}
      {tab === "password" && (
        <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {[
            { key: "old_password", label: "Joriy parol", showKey: "old", placeholder: "Joriy parolingiz" },
            { key: "new_password", label: "Yangi parol", showKey: "new", placeholder: "Yangi parol (min 6 ta belgi)" },
            { key: "confirm_password", label: "Tasdiqlash", showKey: "confirm", placeholder: "Yangi parolni takrorlang" },
          ].map(({ key, label, showKey, placeholder }) => (
            <div key={key}>
              <label style={lStyle}>{label}</label>
              <div style={{ position: "relative" }}>
                <input type={shows[showKey] ? "text" : "password"} placeholder={placeholder}
                  value={passwords[key]} onChange={e => setPasswords({ ...passwords, [key]: e.target.value })}
                  style={{ ...iStyle, paddingRight: "42px", borderColor: key === "confirm_password" && passwords.confirm_password && passwords.confirm_password !== passwords.new_password ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)" }} />
                <button type="button" onClick={() => setShows({ ...shows, [showKey]: !shows[showKey] })}
                  style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.28)" }}>
                  {shows[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button onClick={handleChangePassword} disabled={saving}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", width: "100%", background: saving ? "rgba(99,102,241,0.4)" : "linear-gradient(90deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: 700, color: "white", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? <Loader size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Lock size={15} />}
            {saving ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
          </button>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
