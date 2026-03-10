import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { Eye, EyeOff, Lock, Phone, User, Check } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: "", phone: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const phoneDigits = form.phone.replace(/\D/g, "").slice(0, 9);
  const displayPhone = phoneDigits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError("Ism familiya kiriting"); return; }
    if (phoneDigits.length < 9) { setError("To'liq telefon raqam kiriting"); return; }
    if (form.password.length < 6) { setError("Parol kamida 6 ta belgidan iborat bo'lsin"); return; }
    if (form.password !== form.confirm) { setError("Parollar mos kelmadi"); return; }
    setError("");
    const result = await register({ full_name: form.full_name, phone_number: `+998${phoneDigits}`, password: form.password });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } else setError(result.message);
  };

  if (success) return (
    <div style={{ minHeight: "100vh", background: "#0A0A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "rgba(74,222,128,0.15)", border: "2px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={32} color="#4ade80" />
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "white", marginBottom: "8px" }}>Xush kelibsiz! 🎉</h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Asosiy sahifaga o'tilmoqda...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-200px", right: "-100px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-200px", left: "-100px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: "960px", display: "flex", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", minHeight: "580px" }}>

        {/* Chap panel — Login bilan bir xil */}
        <div className="left-panel" style={{ display: "none", flex: 1, background: "linear-gradient(160deg, #0a0a1f 0%, #0d0d28 50%, #0f0820 100%)", padding: "48px", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {/* Orqa fon effektlar */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "380px", height: "380px", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)" }} />
            <div style={{ position: "absolute", bottom: "5%", left: "10%", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
            <div style={{ position: "absolute", top: "5%", right: "5%", width: "150px", height: "150px", background: "radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 70%)" }} />
          </div>

          {/* Katta logo */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>
            <div style={{ position: "relative" }}>
              {/* Glow ring */}
              <div style={{ position: "absolute", inset: "-16px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", animation: "pulse 3s ease-in-out infinite" }} />
              <div style={{ position: "absolute", inset: "-6px", borderRadius: "50%", border: "1px solid rgba(139,92,246,0.2)", animation: "pulse 3s ease-in-out infinite 0.5s" }} />
              {/* Rasm konteyneri (katta aylana) */}
              <div style={{
                width: "360px",
                height: "360px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid rgba(139,92,246,0.3)",
                boxShadow: "0 0 60px rgba(139,92,246,0.3), 0 0 120px rgba(99,102,241,0.15)",
                flexShrink: 0,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.2)"
              }}>
                <img
                  src="/icons/chontak.png"
                  alt="Cho'ntak"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: "scale(1.8) translateY(4%)",
                    transition: "transform 0.3s ease"
                  }}
                />
              </div>
            </div>

            {/* Brend nomi */}
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "42px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                Cho'ntak<span style={{ background: "linear-gradient(90deg, #a78bfa, #c084fc, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}></span>
              </h1>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: "260px" }}>
                30 soniyada ro'yxatdan o'ting — bepul boshlang, hoziroq
              </p>
            </div>

            {/* Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 18px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "999px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
              <span style={{ fontSize: "13px", color: "#c4b5fd", fontWeight: 600 }}>Xavfsiz to'lov tizimi</span>
            </div>

            {/* Statistika */}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              {[["99.9%", "Uptime"], ["< 1s", "Tezlik"], ["256bit", "Shifrlash"]].map(([v, l]) => (
                <div key={l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px 18px", textAlign: "center", minWidth: "80px" }}>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: "white" }}>{v}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* O'ng panel */}
        <div style={{ flex: 1, background: "#0D0D22", borderLeft: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
                <img src="/icons/chontak.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: "15px", color: "white" }}>Cho'ntak</span>
            </div>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "6px" }}>Hisob yaratish 🚀</h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Ma'lumotlaringizni kiriting</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Ism Familiya</label>
              <div style={{ position: "relative" }}>
                <User size={14} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="text" placeholder="Ism-Sharifingizni kiriting:" value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "14px 14px 14px 40px", fontSize: "14px", color: "white", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Telefon raqam</label>
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Phone size={13} /> +998
                </div>
                <input type="text" inputMode="numeric" placeholder="90 123 45 67" value={displayPhone}
                  onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 9) })}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "14px 16px", fontSize: "14px", color: "white", letterSpacing: "0.05em" }} />
                <div style={{ padding: "0 14px", fontSize: "12px", color: phoneDigits.length === 9 ? "#4ade80" : "rgba(255,255,255,0.2)", fontWeight: 600, flexShrink: 0 }}>
                  {phoneDigits.length}/9
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Parol</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input type={showPass ? "text" : "password"} placeholder="••••••" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "13px 36px 13px 34px", fontSize: "14px", color: "white", outline: "none", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)" }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Tasdiqlash</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input type={showConfirm ? "text" : "password"} placeholder="••••••" value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${form.confirm && form.confirm !== form.password ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: "14px", padding: "13px 36px 13px 34px", fontSize: "14px", color: "white", outline: "none", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)" }}>
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              style={{ width: "100%", background: isLoading ? "rgba(99,102,241,0.5)" : "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "14px", padding: "15px", fontSize: "15px", fontWeight: 700, color: "white", cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {isLoading ? (
                <>
                  <svg style={{ animation: "spin 0.8s linear infinite", width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Yuklanmoqda...
                </>
              ) : "Ro'yxatdan o'tish →"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>yoki</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
          </div>

          <p style={{ textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.35)" }}>
            Hisobingiz bormi?{" "}
            <Link to="/login" style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>
              Kirish →
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.04); } }
        @media (min-width: 768px) { .left-panel { display: flex !important; } }
      `}</style>
    </div>
  );
}
