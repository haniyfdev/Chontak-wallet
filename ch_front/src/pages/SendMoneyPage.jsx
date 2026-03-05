import { useEffect, useState } from "react";
import { cardAPI, transactionAPI } from "../api";
import { Send, CreditCard, ChevronDown, CheckCircle } from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }

export default function SendMoneyPage() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ from_card_id: "", to_card_number: "", amount: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cardAPI.getAll().then((res) => {
      const active = res.data.filter((c) => c.status === "ACTIVE");
      setCards(active);
      if (active.length > 0) setForm(f => ({ ...f, from_card_id: active[0].id }));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(null); setLoading(true);
    try {
      const res = await transactionAPI.send({
        from_card_id: form.from_card_id,
        to_card_number: form.to_card_number,
        amount: parseFloat(form.amount),
        description: form.description,
      });
      setSuccess(res.data);
      setForm(f => ({ ...f, to_card_number: "", amount: "", description: "" }));
    } catch (err) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally { setLoading(false); }
  };

  const selectedCard = cards.find(c => c.id === form.from_card_id);

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", padding: "14px 16px", fontSize: "15px", color: "white",
    outline: "none", boxSizing: "border-box", fontWeight: 500,
    transition: "border-color 0.2s",
  };
  const labelStyle = {
    display: "block", fontSize: "12px", fontWeight: 600,
    color: "rgba(255,255,255,0.45)", marginBottom: "8px", letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  return (
    <div style={{ maxWidth: "560px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "6px" }}>Pul yuborish</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Boshqa kartaga tez va xavfsiz o'tkazma</p>
      </div>

      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px" }}>
          <CheckCircle size={20} color="#4ade80" />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#4ade80" }}>Muvaffaqiyatli yuborildi!</p>
            <p style={{ fontSize: "12px", color: "rgba(74,222,128,0.6)", marginTop: "2px" }}>
              {fmt(success.amount)} so'm yuborildi
              {success.commission > 0 && ` • Komissiya: ${fmt(success.commission)} so'm`}
            </p>
          </div>
        </div>
      )}

      <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Kartadan */}
        <div>
          <label style={labelStyle}>Qaysi kartadan</label>
          {cards.length === 0 ? (
            <div style={{ ...inputStyle, color: "rgba(255,255,255,0.3)" }}>Faol karta yo'q</div>
          ) : (
            <div style={{ position: "relative" }}>
              <select
                value={form.from_card_id}
                onChange={e => setForm({ ...form, from_card_id: e.target.value })}
                style={{ ...inputStyle, paddingRight: "40px", appearance: "none", cursor: "pointer" }}
              >
                {cards.map(c => (
                  <option key={c.id} value={c.id} style={{ background: "#0D0D22" }}>
                    **** {c.card_number?.slice(-4)} — {fmt(c.balance)} so'm
                  </option>
                ))}
              </select>
              <ChevronDown size={16} color="rgba(255,255,255,0.3)" style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          )}
          {selectedCard && (
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", marginTop: "6px", paddingLeft: "4px" }}>
              Mavjud balans: <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{fmt(selectedCard.balance)} so'm</span>
            </p>
          )}
        </div>

        {/* Karta raqami */}
        <div>
          <label style={labelStyle}>Qabul qiluvchi karta raqami</label>
          <div style={{ position: "relative" }}>
            <CreditCard size={16} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={form.to_card_number}
              onChange={e => setForm({ ...form, to_card_number: e.target.value.replace(/\s/g, "") })}
              maxLength={16}
              style={{ ...inputStyle, paddingLeft: "44px", fontFamily: "monospace", letterSpacing: "0.08em" }}
              required
            />
          </div>
        </div>

        {/* Miqdor */}
        <div>
          <label style={labelStyle}>Miqdor</label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              min="1000"
              style={{ ...inputStyle, paddingRight: "60px" }}
              required
            />
            <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>so'm</span>
          </div>
          {form.amount && (
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", marginTop: "6px", paddingLeft: "4px" }}>
              = <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{fmt(form.amount)} so'm</span>
            </p>
          )}
        </div>

        {/* Izoh */}
        <div>
          <label style={labelStyle}>Izoh <span style={{ color: "rgba(255,255,255,0.2)", textTransform: "none", fontWeight: 400 }}>(ixtiyoriy)</span></label>
          <input
            type="text"
            placeholder="Masalan: qarz qaytarish"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", color: "#f87171" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || cards.length === 0}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            width: "100%", background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: "14px", padding: "16px",
            fontSize: "15px", fontWeight: 700, color: "white",
            cursor: loading || cards.length === 0 ? "not-allowed" : "pointer",
            boxShadow: "0 8px 24px rgba(99,102,241,0.3)", transition: "all 0.2s",
            letterSpacing: "0.02em",
          }}
        >
          <Send size={17} />
          {loading ? "Yuborilmoqda..." : "Yuborish"}
        </button>
      </div>
    </div>
  );
}