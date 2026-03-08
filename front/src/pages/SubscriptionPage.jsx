import { useEffect, useState } from "react";
import { cardAPI, subscriptionAPI } from "../api";
import useAuthStore from "../store/authStore";
import { Crown, Check, Loader, Star, Zap, CreditCard, Shield } from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }

const FEATURES = [
  { icon: CreditCard, color: "#a78bfa", title: "5 ta karta",             desc: "Oddiy: 1 ta, Premium: 5 ta" },
  { icon: Zap,        color: "#fbbf24", title: "0% komissiya",           desc: "Barcha o'tkazmalar bepul" },
  { icon: Star,       color: "#34d399", title: "Prioritet support",      desc: "24/7 yordam xizmati" },
  { icon: Shield,     color: "#60a5fa", title: "Kengaytirilgan xavfsizlik", desc: "Qo'shimcha himoya" },
  { icon: Crown,      color: "#f59e0b", title: "Premium badge",          desc: "Profilingizda nishon" },
  { icon: Check,      color: "#4ade80", title: "Cheksiz tranzaksiyalar", desc: "Hech qanday limit yo'q" },
];

const PRICE = 85000;

export default function SubscriptionPage() {
  const { user, fetchMe } = useAuthStore();
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const isPremium = user?.role?.toUpperCase() === "PREMIUM" || user?.role?.toUpperCase() === "ADMIN";

  useEffect(() => {
    cardAPI.getAll().then(r => {
      const active = (r.data || []).filter(c => c.status?.toUpperCase() === "ACTIVE");
      setCards(active);
      if (active.length > 0) setSelectedCardId(active[0].id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const hasEnough = selectedCard && parseFloat(selectedCard.balance) >= PRICE;

  const handleSubscribe = async () => {
    if (!selectedCardId) return;
    setSubscribing(true); setError("");
    try {
      await subscriptionAPI.subscribe(selectedCardId);
      await fetchMe();
      setSuccess(true);
    } catch (err) { setError(err.response?.data?.detail || "Xatolik"); }
    finally { setSubscribing(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (isPremium || success) return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ background: "linear-gradient(135deg,#78350f,#92400e,#b45309)", borderRadius: "24px", padding: "40px", textAlign: "center", boxShadow: "0 20px 60px rgba(245,158,11,0.3)", marginBottom: "20px" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "rgba(251,191,36,0.18)", border: "2px solid rgba(251,191,36,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Crown size={32} color="#fbbf24" />
        </div>
        <h2 style={{ fontSize: "26px", fontWeight: 900, color: "white", marginBottom: "8px" }}>Siz Premium ta'rifidasiz ! 🎉</h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: 1.6 }}>
          Barcha premium imkoniyatlardan foydalaning!
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                <Icon size={17} color={f.color} />
              </div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "3px" }}>{f.title}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ width:"100%" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"24px", alignItems:"start" }}>

        {/* Chap: Hero + Features */}
        <div>
          <div style={{ background:"linear-gradient(135deg,#1c1917,#292524,#44403c)", border:"1px solid rgba(245,158,11,0.18)", borderRadius:"24px", padding:"36px", marginBottom:"16px", textAlign:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:"-50px", right:"-50px", width:"180px", height:"180px", background:"rgba(245,158,11,0.07)", borderRadius:"50%", pointerEvents:"none" }} />
            <div style={{ position:"relative" }}>
              <div style={{ width:"60px", height:"60px", borderRadius:"18px", background:"rgba(245,158,11,0.13)", border:"1px solid rgba(245,158,11,0.28)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <Crown size={28} color="#fbbf24" />
              </div>
              <h1 style={{ fontSize:"28px", fontWeight:900, color:"white", marginBottom:"8px" }}>Cho'ntak Premium</h1>
              <p style={{ color:"rgba(255,255,255,0.42)", fontSize:"14px", marginBottom:"24px" }}>
                Barcha cheklovlarni olib tashlang va to'liq imkoniyatlardan foydalaning
              </p>
              <div style={{ display:"inline-flex", alignItems:"baseline", gap:"4px" }}>
                <span style={{ fontSize:"44px", fontWeight:900, color:"#fbbf24" }}>{fmt(PRICE)}</span>
                <span style={{ fontSize:"16px", color:"rgba(255,255,255,0.45)" }}>so'm/oy</span>
              </div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"14px", display:"flex", gap:"10px" }}>
                  <div style={{ flexShrink:0, marginTop:"1px" }}>
                    <Icon size={17} color={f.color} />
                  </div>
                  <div>
                    <p style={{ fontSize:"12px", fontWeight:700, color:"white", marginBottom:"2px" }}>{f.title}</p>
                    <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.28)", lineHeight:1.4 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* O'ng: Payment panel sticky */}
        <div style={{ position:"sticky", top:"84px" }}>
          <div style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"24px" }}>
            <p style={{ fontSize:"15px", fontWeight:700, color:"white", marginBottom:"4px" }}>To'lov kartasini tanlang</p>
            <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.28)", marginBottom:"16px" }}>Kartangizdan {fmt(PRICE)} so'm yechilib olinadi</p>

            {cards.length === 0 ? (
              <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:"12px", padding:"13px", fontSize:"13px", color:"#f87171", marginBottom:"16px" }}>
                Faol kartangiz yo'q. Avval karta yarating.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"16px" }}>
                {cards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCardId(card.id)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:selectedCardId===card.id?"rgba(99,102,241,0.1)":"rgba(255,255,255,0.03)", border:`1px solid ${selectedCardId===card.id?"rgba(99,102,241,0.28)":"rgba(255,255,255,0.07)"}`, borderRadius:"12px", cursor:"pointer", textAlign:"left", width:"100%" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:selectedCardId===card.id?"#6366f1":"rgba(255,255,255,0.15)", transition:"all 0.2s" }} />
                      <span style={{ fontSize:"13px", fontFamily:"monospace", color:"white", letterSpacing:"0.06em" }}>
                        •••• {card.card_number?.slice(-4)}
                      </span>
                    </div>
                    <span style={{ fontSize:"13px", fontWeight:700, color:parseFloat(card.balance)>=PRICE?"white":"#f87171" }}>
                      {fmt(card.balance)} so'm
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:"12px", padding:"12px 14px", marginBottom:"16px", display:"flex", flexDirection:"column", gap:"8px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px" }}>
                <span style={{ color:"rgba(255,255,255,0.38)" }}>Obuna narxi</span>
                <span style={{ color:"white", fontWeight:600 }}>{fmt(PRICE)} so'm</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px" }}>
                <span style={{ color:"rgba(255,255,255,0.38)" }}>Komissiya</span>
                <span style={{ color:"#4ade80", fontWeight:600 }}>Bepul</span>
              </div>
            </div>

            {selectedCard && !hasEnough && (
              <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:"12px", padding:"11px 14px", marginBottom:"14px", fontSize:"13px", color:"#f87171" }}>
                Hisobda yetarli mablag' yo'q. Kerak: {fmt(PRICE)} so'm
              </div>
            )}
            {error && (
              <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"12px", padding:"11px 14px", marginBottom:"14px", fontSize:"13px", color:"#f87171" }}>{error}</div>
            )}

            <button onClick={handleSubscribe} disabled={subscribing || !hasEnough || cards.length===0}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"14px", background:!hasEnough||cards.length===0?"rgba(245,158,11,0.25)":"linear-gradient(90deg,#d97706,#b45309)", border:"none", borderRadius:"12px", cursor:!hasEnough||cards.length===0?"not-allowed":"pointer", color:"white", fontSize:"15px", fontWeight:700, boxShadow:hasEnough?"0 4px 16px rgba(245,158,11,0.28)":"none" }}>
              {subscribing ? <Loader size={16} style={{ animation:"spin 0.8s linear infinite" }} /> : <Crown size={16} />}
              {subscribing ? "Amalga oshirilmoqda..." : `Premium — ${fmt(PRICE)} so'm/oy`}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
