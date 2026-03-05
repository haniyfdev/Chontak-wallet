import { useEffect, useState } from "react";
import { cardAPI, subscriptionAPI } from "../api";
import useAuthStore from "../store/authStore";
import { Crown, Check, ChevronDown, Loader, Zap, Star } from "lucide-react";

const PREMIUM_PRICE = 30000;
const features = [
  { icon: "💳", text: "5 tagacha karta ochish imkoniyati" },
  { icon: "⚡", text: "Komissiyasiz pul o'tkazish" },
  { icon: "🛡️", text: "Kengaytirilgan xavfsizlik" },
  { icon: "📊", text: "To'liq tranzaksiya tarixi" },
  { icon: "🔄", text: "Oylik avtomatik yangilanish" },
  { icon: "🎯", text: "Ustunlik texnik qo'llab-quvvatlash" },
];

export default function SubscriptionPage() {
  const { user, fetchMe } = useAuthStore();
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState("");
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isPremium = user?.role === "PREMIUM" || user?.role === "ADMIN";

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    try {
      const res = await cardAPI.getAll();
      const active = res.data.filter(c => c.status === "ACTIVE");
      setCards(active);
      if (active.length > 0) {
        setSelectedCard(active[0].id);
        try { const s = await subscriptionAPI.get(active[0].id); setSub(s.data); } catch {}
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubscribe = async () => {
    if (!selectedCard) return;
    setSubscribing(true); setError("");
    try {
      const res = await subscriptionAPI.subscribe(selectedCard);
      setSub(res.data); setSuccess(true); await fetchMe();
    } catch (e) { setError(e.response?.data?.detail || "Xatolik yuz berdi"); }
    finally { setSubscribing(false); }
  };

  const selectedCardObj = cards.find(c => c.id === selectedCard);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid rgba(245,158,11,0.3)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "4px" }}>Premium obuna</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Cho'ntak Premium bilan barcha imkoniyatlardan foydalaning</p>
      </div>

      {/* Premium hero card */}
      <div style={{ borderRadius: "20px", background: "linear-gradient(135deg, #78350f 0%, #92400e 40%, #78350f 100%)", padding: "28px", marginBottom: "16px", position: "relative", overflow: "hidden", border: "1px solid rgba(245,158,11,0.3)", boxShadow: "0 20px 60px rgba(245,158,11,0.2)" }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px", background: "rgba(245,158,11,0.15)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-30px", left: "30%", width: "120px", height: "120px", background: "rgba(245,158,11,0.08)", borderRadius: "50%" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={22} color="#fbbf24" />
            </div>
            <div>
              <p style={{ fontSize: "18px", fontWeight: 800, color: "#fbbf24" }}>Cho'ntak Premium</p>
              <p style={{ fontSize: "12px", color: "rgba(251,191,36,0.6)" }}>Barcha imkoniyatlar ochiq</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "40px", fontWeight: 900, color: "white" }}>{Number(PREMIUM_PRICE).toLocaleString("uz-UZ")}</span>
            <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>so'm / oy</span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>Avtomatik yangilanadi • Istalgan vaqt bekor qilinadi</p>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", marginBottom: "16px" }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Zap size={16} color="#fbbf24" /> Nima kiradi?
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
              <span style={{ fontSize: "18px" }}>{f.icon}</span>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 500, lineHeight: 1.4 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      {isPremium && sub ? (
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "28px", textAlign: "center" }}>
          <Crown size={36} color="#fbbf24" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: "18px", fontWeight: 800, color: "white", marginBottom: "6px" }}>Siz Premium foydalanuvchisiz! 🎉</p>
          {sub.next_payment_at && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              Keyingi to'lov: {new Date(sub.next_payment_at).toLocaleDateString("uz-UZ")}
            </p>
          )}
        </div>
      ) : success ? (
        <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "20px", padding: "28px", textAlign: "center" }}>
          <Crown size={36} color="#fbbf24" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: "18px", fontWeight: 800, color: "white" }}>Premium faollashtirildi! 🎉</p>
        </div>
      ) : (
        <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>Qaysi kartadan to'lash</p>
          {cards.length === 0 ? (
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "20px" }}>Faol karta yo'q. Avval karta yarating.</p>
          ) : (
            <>
              <div style={{ position: "relative" }}>
                <select
                  value={selectedCard}
                  onChange={e => setSelectedCard(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "13px 40px 13px 16px", fontSize: "14px", color: "white", outline: "none", appearance: "none", cursor: "pointer", boxSizing: "border-box" }}
                >
                  {cards.map(c => (
                    <option key={c.id} value={c.id} style={{ background: "#0D0D22" }}>
                      **** {c.card_number?.slice(-4)} — {Number(c.balance).toLocaleString("uz-UZ")} so'm
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} color="rgba(255,255,255,0.3)" style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>

              {selectedCardObj && selectedCardObj.balance < PREMIUM_PRICE && (
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#fbbf24" }}>
                  ⚠️ Karta balansida yetarli mablag' yo'q ({Number(selectedCardObj.balance).toLocaleString()} so'm)
                </div>
              )}

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#f87171" }}>{error}</div>
              )}

              <button
                onClick={handleSubscribe}
                disabled={subscribing || !selectedCard}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%", background: "linear-gradient(90deg, #d97706, #f59e0b)", border: "none", borderRadius: "14px", padding: "16px", fontSize: "15px", fontWeight: 800, color: "white", cursor: subscribing ? "not-allowed" : "pointer", boxShadow: "0 8px 24px rgba(245,158,11,0.35)", opacity: subscribing ? 0.7 : 1, letterSpacing: "0.02em" }}
              >
                {subscribing ? <Loader size={17} style={{ animation: "spin 0.8s linear infinite" }} /> : <Crown size={17} />}
                {subscribing ? "Faollashtirilmoqda..." : `Premium — ${Number(PREMIUM_PRICE).toLocaleString()} so'm / oy`}
              </button>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}