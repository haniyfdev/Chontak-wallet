import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { cardAPI, transactionAPI } from "../api";
import useAuthStore from "../store/authStore";
import {
  Send, ArrowLeftRight, CreditCard, BookmarkCheck,
  Plus, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Wifi
} from "lucide-react";

const BASE_URL = "http://localhost:8000";
function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function MiniCard({ card, visible }) {
  const isActive = card.status === "ACTIVE";
  const isFrozen = card.status === "FROZEN";
  const num = card.card_number || "";
  const exp = card.expiry_date
    ? new Date(card.expiry_date).toLocaleDateString("uz-UZ", { month: "2-digit", year: "2-digit" })
    : "";

  return (
    <div
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        e.currentTarget.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
      }}
      onMouseLeave={e => { e.currentTarget.style.transform = "perspective(600px) rotateY(0) rotateX(0) scale(1)"; }}
      style={{
        borderRadius: "16px", padding: "20px 22px", position: "relative", overflow: "hidden",
        background: isFrozen
          ? "linear-gradient(135deg, #1e3a5f, #1e40af, #2563eb)"
          : "linear-gradient(135deg, #1e1b4b, #312e81, #4f46e5)",
        boxShadow: "0 12px 32px rgba(99,102,241,0.3)",
        opacity: card.status === "CLOSED" ? 0.5 : 1,
        flexShrink: 0, width: "100%",
        transition: "transform 0.15s ease",
      }}>
      <div style={{ position: "absolute", top: "-24px", right: "-24px", width: "100px", height: "100px", background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "-16px", left: "30%", width: "70px", height: "70px", background: "rgba(255,255,255,0.03)", borderRadius: "50%" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CreditCard size={14} color="white" />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Cho'ntak</span>
          </div>
          <Wifi size={16} color="rgba(255,255,255,0.4)" style={{ transform: "rotate(90deg)" }} />
        </div>
        <p style={{ fontSize: "17px", fontWeight: 900, color: "white", fontFamily: "'Courier New', monospace", letterSpacing: "0.16em", marginBottom: "18px" }}>
          {visible ? (num.match(/.{1,4}/g)?.join("  ") || "") : `•••• •••• •••• ${num.slice(-4)}`}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Balans</p>
            <p style={{ fontSize: "17px", fontWeight: 900, color: visible ? "white" : "rgba(255,255,255,0.3)" }}>
              {visible ? `${fmt(card.balance)} so'm` : "••••••"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Muddati</p>
            <p style={{ fontSize: "12px", fontWeight: 700, color: visible ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
              {visible ? exp : "••/••"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideAll, setHideAll] = useState(true);
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  const totalBalance = cards.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0);
  const [mounted, setMounted] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  // Balans counter animatsiya
  useEffect(() => {
    if (!loading && totalBalance > 0) {
      setMounted(true);
      const duration = 1400;
      const steps = 60;
      const increment = totalBalance / steps;
      let current = 0;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        current = step === steps ? totalBalance : Math.min(current + increment * (1 + (steps - step) / steps * 0.5), totalBalance);
        setDisplayBalance(current);
        if (step >= steps) clearInterval(timer);
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [loading, totalBalance]);

  // Stats cards fade-in observer
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.1 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [loading]);
  const cardIds = new Set(cards.map(c => c.id));

  useEffect(() => {
    // 8 soniya timeout — backend javob bermasa ham sahifa ochilsin
    const timeout = setTimeout(() => setLoading(false), 8000);
    Promise.all([
      cardAPI.getAll(),
      transactionAPI.getAll({ limit: 5, page: 1 }),
    ]).then(([cr, tr]) => {
      setCards(cr.data || []);
      setTransactions(tr.data?.data || []);
    }).catch(e => console.error("Dashboard load error:", e))
    .finally(() => { clearTimeout(timeout); setLoading(false); });
  }, []);

  const quickActions = [
    { icon: Send,            label: "Yuborish",    sub: "Pul o'tkazish",  path: "/send",        color: "#818cf8", bg: "rgba(129,140,248,0.1)",  border: "rgba(129,140,248,0.2)" },
    { icon: ArrowLeftRight,  label: "Tarix",       sub: "Tranzaksiyalar", path: "/transactions", color: "#34d399", bg: "rgba(52,211,153,0.1)",   border: "rgba(52,211,153,0.2)"  },
    { icon: CreditCard,      label: "Kartalar",    sub: `${cards.length} ta`,   path: "/cards",        color: "#60a5fa", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.2)"  },
    { icon: BookmarkCheck,   label: "Saqlangan",   sub: "Tez yuborish",   path: "/saved-cards",  color: "#4ade80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.2)"  },
  ];

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: "20px" }}>
      <div style={{ position: "relative", width: "56px", height: "56px" }}>
        <div style={{ position: "absolute", inset: 0, border: "3px solid rgba(99,102,241,0.15)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", inset: 0, border: "3px solid transparent", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
        <div style={{ position: "absolute", inset: "8px", border: "2px solid transparent", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.7s linear infinite reverse" }} />
      </div>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", animation: "pulse2 1.5s ease-in-out infinite" }}>Yuklanmoqda...</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse2{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: "24px", animation: "slideUp 0.5s ease-out both" }}>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", marginBottom: "4px" }}>Xush kelibsiz,</p>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "white" }}>
          {user?.full_name} 👋
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Balance card */}
          <div style={{ borderRadius: "20px", padding: "28px 32px", background: "linear-gradient(135deg, #312e81 0%, #4c1d95 40%, #6d28d9 100%)", position: "relative", overflow: "hidden", boxShadow: "0 16px 48px rgba(109,40,217,0.4)", animation: "slideUp 0.4s ease-out both" }}>
            <div style={{ position: "absolute", top: "-60px", right: "-40px", width: "220px", height: "220px", background: "rgba(255,255,255,0.06)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-40px", left: "30%", width: "160px", height: "160px", background: "rgba(255,255,255,0.03)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Umumiy balans</p>
                <button onClick={() => setHideAll(!hideAll)}
                  style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
                  {hideAll ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p style={{ fontSize: "42px", fontWeight: 900, color: "white", letterSpacing: "-1px", marginBottom: "12px", textShadow: hideAll ? "none" : "0 0 40px rgba(167,139,250,0.5)", transition: "text-shadow 0.3s" }}>
                {hideAll ? "••••••••" : `${fmt(displayBalance)} so'm`}
              </p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                {cards.length} ta karta • Cho'ntak wallet
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
            {quickActions.map(({ icon: Icon, label, sub, path, color, bg, border }, qi) => (
              <button key={path} onClick={() => navigate(path)}
                style={{ background: "#0D0D22", border: `1px solid ${border}`, borderRadius: "16px", padding: "20px 16px", cursor: "pointer", textAlign: "center", transition: "all 0.2s", animation: `slideUp 0.4s ease-out ${0.1 + qi * 0.08}s both` }}
                onMouseEnter={e => { e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${bg}`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#0D0D22"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Icon size={20} color={color} />
                </div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "2px" }}>{label}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{sub}</p>
              </button>
            ))}
          </div>

          {/* Recent transactions */}
          <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>So'nggi tranzaksiyalar</p>
              <button onClick={() => navigate("/transactions")} style={{ fontSize: "12px", color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Barchasi →</button>
            </div>
            {transactions.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px", textAlign: "center", padding: "20px" }}>Tranzaksiyalar yo'q</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {transactions.map(tx => {
                  const isOut = cardIds.has(tx.from_card_id);
                  return (
                    <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", animation: "slideUp 0.3s ease-out both" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: isOut ? "rgba(239,68,68,0.1)" : "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isOut ? <ArrowUpRight size={15} color="#f87171" /> : <ArrowDownLeft size={15} color="#4ade80" />}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>
                            {tx.description || (isOut ? "Pul yuborish" : "Kirim")}
                          </p>
                          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: "14px", fontWeight: 800, color: isOut ? "#f87171" : "#4ade80" }}>
                        {isOut ? "−" : "+"}{fmt(tx.amount)} so'm
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>Kartalarim</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => navigate("/cards")} style={{ fontSize: "12px", color: "#818cf8", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Barchasi →</button>
              <button onClick={() => navigate("/cards")} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", padding: "5px 10px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", cursor: "pointer", color: "#818cf8", fontWeight: 600 }}>
                <Plus size={12} /> Yangi
              </button>
            </div>
          </div>

          {cards.length === 0 ? (
            <div style={{ background: "#0D0D22", border: "2px dashed rgba(255,255,255,0.08)", borderRadius: "16px", padding: "40px 20px", textAlign: "center" }}>
              <CreditCard size={32} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 10px" }} />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Karta yo'q</p>
            </div>
          ) : (
            <>
              <MiniCard card={cards[activeCardIdx]} visible={!hideAll} />

              {/* Dots */}
              {cards.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                  {cards.map((_, i) => (
                    <button key={i} onClick={() => setActiveCardIdx(i)}
                      style={{ width: i === activeCardIdx ? "20px" : "6px", height: "6px", borderRadius: "999px", background: i === activeCardIdx ? "#6366f1" : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s" }} />
                  ))}
                </div>
              )}

              {/* Card list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {cards.map((card, i) => {
                  const sc = { ACTIVE: { color: "#4ade80" }, FROZEN: { color: "#60a5fa" }, CLOSED: { color: "#f87171" } };
                  const sl = { ACTIVE: "Faol", FROZEN: "Muzlatilgan", CLOSED: "Yopilgan" };
                  return (
                    <button key={card.id} onClick={() => setActiveCardIdx(i)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: i === activeCardIdx ? "rgba(99,102,241,0.1)" : "#0D0D22", border: `1px solid ${i === activeCardIdx ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", cursor: "pointer", width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc[card.status]?.color || "#fff" }} />
                        <span style={{ fontSize: "13px", fontFamily: "monospace", color: "white", letterSpacing: "0.05em" }}>
                          •••• {card.card_number?.slice(-4)}
                        </span>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{sl[card.status]}</span>
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                        {!hideAll ? `${fmt(card.balance)} so'm` : "••••••"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @media(max-width:900px){
          .dash-grid { grid-template-columns: 1fr !important; }
          .quick-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
