import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cardAPI, transactionAPI } from "../api";
import useAuthStore from "../store/authStore";
import {
  CreditCard, Send, ArrowDownLeft, ArrowUpRight,
  Plus, Crown, TrendingUp, Eye, EyeOff, Wallet
} from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Alohida card component — har birida o'z visible state
function CardItem({ card, hideAll }) {
  const [visible, setVisible] = useState(false);
  const show = visible && !hideAll;

  const statusColors = { ACTIVE: "#4ade80", FROZEN: "#60a5fa", CLOSED: "#f87171" };
  const statusLabels = { ACTIVE: "Faol", FROZEN: "Muzlatilgan", CLOSED: "Yopilgan" };

  const maskedNumber = card.card_number
    ? `•••• •••• •••• ${card.card_number.slice(-2)}`
    : "•••• •••• •••• ••";

  const fullNumber = card.card_number
    ? card.card_number.replace(/(.{4})/g, "$1  ").trim()
    : "";

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "14px", padding: "14px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CreditCard size={17} color="#818cf8" />
        </div>
        <div>
          <p style={{ fontSize: "15px", fontWeight: 800, color: "white", fontFamily: "'Courier New', Courier, monospace", letterSpacing: "0.12em", marginBottom: "3px" }}>
            {show ? fullNumber : maskedNumber}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: statusColors[card.status] }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{statusLabels[card.status]}</span>
            {show && card.expiry_date && (
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginLeft: "4px" }}>
                {new Date(card.expiry_date).toLocaleDateString("uz-UZ", { month: "2-digit", year: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <p style={{ fontSize: "15px", fontWeight: 800, color: show ? "white" : "rgba(255,255,255,0.3)", letterSpacing: "-0.3px", textAlign: "right" }}>
          {show ? `${fmt(card.balance)} so'm` : "••••••"}
        </p>
        <button
          onClick={() => setVisible(!visible)}
          style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: visible ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${visible ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "8px", cursor: "pointer", color: visible ? "#a5b4fc" : "rgba(255,255,255,0.4)", transition: "all 0.2s" }}
        >
          {visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cr, tr] = await Promise.all([
        cardAPI.getAll(),
        transactionAPI.getAll({ limit: 6, page: 1 }),
      ]);
      setCards(cr.data);
      setTransactions(tr.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateCard = async () => {
    setCreatingCard(true);
    try { await cardAPI.create(); await fetchData(); }
    catch (e) { alert(e.response?.data?.detail || "Xatolik"); }
    finally { setCreatingCard(false); }
  };

  const totalBalance = cards.reduce((s, c) => s + parseFloat(c.balance || 0), 0);
  const isPremium = user?.role === "PREMIUM" || user?.role === "ADMIN";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", marginBottom: "2px" }}>Xush kelibsiz,</p>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "white" }}>{user?.full_name} 👋</h1>
        </div>
        {isPremium && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "999px" }}>
            <Crown size={13} color="#fbbf24" />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#fbbf24" }}>Premium</span>
          </div>
        )}
      </div>

      {/* Balance card */}
      <div style={{ borderRadius: "20px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", padding: "28px", position: "relative", overflow: "hidden", boxShadow: "0 20px 60px rgba(99,102,241,0.35)" }}>
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", background: "rgba(255,255,255,0.07)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "160px", height: "160px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", fontWeight: 500 }}>Umumiy balans</p>
            <button onClick={() => setHideBalance(!hideBalance)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "6px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}>
              {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p style={{ fontSize: "36px", fontWeight: 900, color: "white", marginBottom: "4px", letterSpacing: "-1px" }}>
            {hideBalance ? "••••••••" : `${fmt(totalBalance)} so'm`}
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>{cards.length} ta karta • Cho'ntak wallet</p>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { to: "/send", icon: Send, label: "Yuborish", sub: "Pul o'tkazish", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
          { to: "/transactions", icon: TrendingUp, label: "Tarix", sub: "Tranzaksiyalar", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
          { to: "/cards", icon: CreditCard, label: "Kartalar", sub: `${cards.length} ta`, color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
          { to: "/saved-cards", icon: Wallet, label: "Saqlangan", sub: "Tez to'lov", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
        ].map(({ to, icon: Icon, label, sub, color, bg }) => (
          <Link key={to} to={to} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "20px 12px", background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", textDecoration: "none", textAlign: "center", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color + "50"; e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "#0D0D22"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "white", marginBottom: "2px" }}>{label}</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Kartalar */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>Kartalarim</h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleCreateCard} disabled={creatingCard} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "10px", cursor: "pointer", color: "#a5b4fc", fontSize: "12px", fontWeight: 600 }}>
              <Plus size={13} />{creatingCard ? "..." : "Yangi karta"}
            </button>
            <Link to="/cards" style={{ padding: "6px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
              Barchasi
            </Link>
          </div>
        </div>

        {cards.length === 0 ? (
          <div style={{ background: "#0D0D22", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
            <CreditCard size={32} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 10px" }} />
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Hali karta yo'q</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {cards.map(card => (
              <CardItem key={card.id} card={card} hideAll={hideBalance} />
            ))}
          </div>
        )}
      </div>

      {/* Tranzaksiyalar */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>So'nggi tranzaksiyalar</h2>
          <Link to="/transactions" style={{ padding: "6px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
            Barchasi
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "32px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Tranzaksiyalar yo'q</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {transactions.map((tx) => {
              const isOut = cards.some(c => c.id === tx.from_card_id);
              return (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "12px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: isOut ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${isOut ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isOut ? <ArrowUpRight size={16} color="#f87171" /> : <ArrowDownLeft size={16} color="#4ade80" />}
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>{tx.description || (isOut ? "O'tkazma" : "Kirim")}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>{fmtDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "15px", fontWeight: 800, color: isOut ? "#f87171" : "#4ade80" }}>
                      {isOut ? "−" : "+"}{fmt(tx.amount)}
                    </p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>so'm</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}