import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { Wallet, Eye, EyeOff, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: "", phone_number: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPhone(digits);
    setForm(f => ({ ...f, phone_number: `+998${digits}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phone.length < 9) { setError("To'liq telefon raqam kiriting"); return; }
    setError("");
    const result = await register(form);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A1A", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>

      {/* Glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-200px", right: "-100px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-200px", left: "-100px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", width: "100%", maxWidth: "960px", display: "flex", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", minHeight: "580px" }}>

        {/* Chap panel */}
        <div style={{ flex: 1, background: "#0D0D22", padding: "48px", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden", display: "none" }} className="left-panel">
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.08) 50%, transparent 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
              <Wallet size={20} color="white" />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>Cho'ntak</span>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "999px", marginBottom: "24px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: "12px", color: "#c4b5fd", fontWeight: 500 }}>Bepul ro'yxatdan o'ting</span>
            </div>
            <h1 style={{ fontSize: "40px", fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: "16px" }}>
              Kelajak uchun<br />
              <span style={{ background: "linear-gradient(90deg, #a78bfa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                aqlli qadam
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px", lineHeight: 1.7 }}>
              Cho'ntak — zamonaviy raqamli hamyon. Bir daqiqada hisob oching va pul boshqarishni boshlang.
            </p>
          </div>

          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { emoji: "🚀", text: "30 soniyada ro'yxatdan o'ting" },
              { emoji: "🔒", text: "Ma'lumotlaringiz 100% himoyalangan" },
              { emoji: "💸", text: "Birinchi karta bepul" },
            ].map(({ emoji, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
                <span style={{ fontSize: "20px" }}>{emoji}</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* O'ng panel */}
        <div style={{ width: "420px", background: "#0D0D22", borderLeft: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <span style={{ fontSize: "28px" }}>✓</span>
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, color: "white", marginBottom: "8px" }}>Muvaffaqiyatli ro'yxatdan o'tdingiz!</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Login sahifasiga yo'naltirilmoqda...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wallet size={16} color="white" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "white" }}>Cho'ntak</span>
                </div>
                <h2 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "6px" }}>Hisob yaratish 🎉</h2>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Ma'lumotlaringizni kiriting</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                {/* Ism */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    To'liq ism
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={15} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                      type="text"
                      placeholder="Ism Familiya"
                      value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "14px 16px 14px 42px", fontSize: "14px", color: "white", outline: "none", boxSizing: "border-box", fontWeight: 500 }}
                      required
                    />
                  </div>
                </div>

                {/* Telefon */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Telefon raqam
                  </label>
                  <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", overflow: "hidden" }}>
                    <div style={{ padding: "0 14px", borderRight: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap", color: "rgba(255,255,255,0.6)", fontSize: "14px", fontWeight: 600, flexShrink: 0 }}>
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
                    <div style={{ padding: "0 14px", fontSize: "12px", color: phone.length === 9 ? "#4ade80" : "rgba(255,255,255,0.2)", fontWeight: 600, flexShrink: 0 }}>
                      {phone.length}/9
                    </div>
                  </div>
                </div>

                {/* Parol */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Parol
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={15} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Kamida 8 ta belgi"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "14px 42px 14px 42px", fontSize: "14px", color: "white", outline: "none", boxSizing: "border-box", fontWeight: 500 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)" }}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", color: "#f87171" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ width: "100%", background: isLoading ? "rgba(99,102,241,0.5)" : "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "14px", padding: "15px", fontSize: "15px", fontWeight: 700, color: "white", cursor: isLoading ? "not-allowed" : "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.35)", letterSpacing: "0.02em" }}
                >
                  {isLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <svg style={{ animation: "spin 0.8s linear infinite", width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Yaratilmoqda...
                    </span>
                  ) : "Hisob yaratish →"}
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
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (min-width: 768px) { .left-panel { display: flex !important; } }
      `}</style>
    </div>
  );
}