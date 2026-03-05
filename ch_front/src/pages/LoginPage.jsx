import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { Wallet, Eye, EyeOff, Lock } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPhone(digits);
  };

  const fullPhone = `+998${phone}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 9) {
      setError("9 ta raqam kiriting");
      return;
    }
    setError("");
    const result = await login(fullPhone, password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>

      {/* Glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-200px", left: "-100px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-200px", right: "-100px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: "960px", display: "flex", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>

        {/* ===== CHAP PANEL ===== */}
        <div style={{ flex: 1, background: "#0D0D22", padding: "48px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}
          className="hidden lg:flex">
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 50%, transparent 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Logo */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
              <Wallet size={20} color="white" />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>Cho'ntak</span>
          </div>

          {/* Matn */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "999px", marginBottom: "24px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: "12px", color: "#a5b4fc", fontWeight: 500 }}>Xavfsiz to'lov tizimi</span>
            </div>
            <h1 style={{ fontSize: "40px", fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: "16px" }}>
              Pulingizni aqlli<br />
              <span style={{ background: "linear-gradient(90deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                boshqaring
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px", lineHeight: 1.7 }}>
              Cho'ntak — tez, xavfsiz va qulay raqamli hamyon. Istalgan vaqt, istalgan joydan foydalaning.
            </p>
          </div>

          {/* Stats */}
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { value: "99.9%", label: "Uptime" },
              { value: "< 1s", label: "Tezlik" },
              { value: "256bit", label: "Shifrlash" },
            ].map(({ value, label }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px 16px", textAlign: "center" }}>
                <p style={{ fontSize: "22px", fontWeight: 700, color: "white", marginBottom: "4px" }}>{value}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== O'NG PANEL — FORM ===== */}
        <div style={{ width: "420px", background: "#0D0D22", borderLeft: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }} className="lg:hidden">
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, color: "white" }}>Cho'ntak</span>
          </div>

          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "white", marginBottom: "6px" }}>Xush kelibsiz 👋</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", marginBottom: "36px" }}>Hisobingizga kirish uchun ma'lumotlarni kiriting</p>

          <form onSubmit={handleSubmit}>

            {/* Telefon */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                TELEFON RAQAM
              </label>
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", overflow: "hidden", transition: "border-color 0.2s" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              >
                <div style={{ padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap", color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 600 }}>
                  +998
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="90 123 45 67"
                  value={phone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4")}
                  onChange={handlePhoneChange}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "14px 16px", fontSize: "14px", color: "white", letterSpacing: "0.05em" }}
                  required
                />
                <div style={{ padding: "0 14px", fontSize: "12px", color: phone.length === 9 ? "#4ade80" : "rgba(255,255,255,0.2)", fontWeight: 600 }}>
                  {phone.length}/9
                </div>
              </div>
            </div>

            {/* Parol */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                PAROL
              </label>
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "0 14px", color: "rgba(255,255,255,0.25)" }}>
                  <Lock size={15} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Parolingizni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "14px 0", fontSize: "14px", color: "white" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ padding: "0 16px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)" }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "14px", padding: "14px", fontSize: "14px", fontWeight: 700, color: "white", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1, boxShadow: "0 8px 24px rgba(99,102,241,0.35)", transition: "all 0.2s", letterSpacing: "0.02em" }}
            >
              {isLoading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg style={{ animation: "spin 1s linear infinite", width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Kirish...
                </span>
              ) : "Kirish →"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>yoki</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
          </div>

          <p style={{ textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.35)" }}>
            Hisobingiz yo'qmi?{" "}
            <Link to="/register" style={{ color: "#818cf8", fontWeight: 600, textDecoration: "none" }}>
              Ro'yxatdan o'ting →
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}