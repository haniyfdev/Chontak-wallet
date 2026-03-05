import { useEffect, useState } from "react";
import { cardAPI } from "../api";
import { CreditCard, Plus, Snowflake, Play, Loader } from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    try {
      const res = await cardAPI.getAll();
      setCards(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setCreating(true); setError("");
    try { await cardAPI.create(); await fetchCards(); }
    catch (e) { setError(e.response?.data?.detail || "Xatolik"); }
    finally { setCreating(false); }
  };

  const handleFreeze = async (card) => {
    setActionLoading(card.id);
    try {
      if (card.status === "ACTIVE") await cardAPI.freeze(card.id);
      else if (card.status === "FROZEN") await cardAPI.unfreeze(card.id);
      await fetchCards();
    } catch (e) { setError(e.response?.data?.detail || "Xatolik"); }
    finally { setActionLoading(null); }
  };

  const statusConfig = {
    ACTIVE:  { label: "Faol",        color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.25)"  },
    FROZEN:  { label: "Muzlatilgan", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)"  },
    CLOSED:  { label: "Yopilgan",    color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "4px" }}>Kartalarim</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>{cards.length} ta karta</p>
        </div>
        <button
          onClick={handleCreate} disabled={creating}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "12px", cursor: creating ? "not-allowed" : "pointer", color: "white", fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(99,102,241,0.35)", opacity: creating ? 0.7 : 1 }}
        >
          {creating ? <Loader size={15} style={{ animation: "spin 0.8s linear infinite" }} /> : <Plus size={15} />}
          Yangi karta
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#f87171" }}>
          {error}
        </div>
      )}

      {cards.length === 0 ? (
        <div style={{ background: "#0D0D22", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: "20px", padding: "60px", textAlign: "center" }}>
          <CreditCard size={40} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", fontWeight: 600 }}>Sizda karta mavjud emas</p>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px", marginTop: "4px" }}>Yuqoridagi tugmani bosib karta yarating</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {cards.map((card) => {
            const st = statusConfig[card.status] || statusConfig.ACTIVE;
            const isFrozen = card.status === "FROZEN";
            const isActive = card.status === "ACTIVE";
            const isClosed = card.status === "CLOSED";

            return (
              <div key={card.id} style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0D0D22" }}>
                {/* Karta visual */}
                <div style={{ background: isFrozen ? "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #1d4ed8 100%)" : "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", padding: "24px 28px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "140px", height: "140px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
                  <div style={{ position: "absolute", bottom: "-20px", left: "40%", width: "100px", height: "100px", background: "rgba(255,255,255,0.03)", borderRadius: "50%" }} />

                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CreditCard size={16} color="white" />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Cho'ntak</span>
                      </div>
                      {/* Faqat status badge — freeze/unfreeze tugmasi pastda */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px", background: st.bg, border: `1px solid ${st.border}`, borderRadius: "999px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: st.color }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: st.color }}>{st.label}</span>
                      </div>
                    </div>

                    {/* Karta raqami — balans bilan bir xil shrift */}
                    <p style={{ fontSize: "22px", fontWeight: 900, color: "white", fontFamily: "'Courier New', Courier, monospace", letterSpacing: "0.18em", marginBottom: "20px" }}>
                      {card.card_number?.replace(/(.{4})/g, "$1  ").trim()}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Balans</p>
                        <p style={{ fontSize: "24px", fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>
                          {fmt(card.balance)} <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>so'm</span>
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Muddati</p>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
                          {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString("uz-UZ", { month: "2-digit", year: "2-digit" }) : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pastki action — faqat ACTIVE yoki FROZEN uchun */}
                {!isClosed && (
                  <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleFreeze(card)}
                      disabled={actionLoading === card.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "9px 18px", borderRadius: "10px", border: "none", cursor: "pointer",
                        fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
                        background: isActive ? "rgba(96,165,250,0.12)" : "rgba(74,222,128,0.12)",
                        color: isActive ? "#60a5fa" : "#4ade80",
                        opacity: actionLoading === card.id ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === card.id
                        ? <Loader size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                        : isActive ? <Snowflake size={14} /> : <Play size={14} />
                      }
                      {isActive ? "Muzlatish" : "Faollashtirish"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}