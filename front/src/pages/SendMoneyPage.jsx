import { useEffect, useState, useRef, useCallback } from "react";
import { cardAPI, transactionAPI, savedCardAPI } from "../api";
import useAuthStore from "../store/authStore";
import { Send, ArrowRight, Loader, AlertCircle, CreditCard, X, Check } from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }
function getNum(card) { return card?.card_number || card?.number || card?.pan || ""; }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Konfetti zarrasi
function Particle({ x, color, delay }) {
  const size = Math.random() * 8 + 4;
  const duration = Math.random() * 1.5 + 1.5;
  const rotateEnd = Math.random() * 720 - 360;
  const xEnd = (Math.random() - 0.5) * 300;
  return (
    <div style={{
      position: "fixed", left: x, top: "40%", width: size, height: size,
      background: color, borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      pointerEvents: "none", zIndex: 1100,
      animation: `confettiFall ${duration}s ease-out ${delay}s both`,
      "--x-end": `${xEnd}px`,
      "--rotate-end": `${rotateEnd}deg`,
    }} />
  );
}

function ReceiptModal({ tx, onClose }) {
  if (!tx) return null;
  const [show, setShow] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const [amountVisible, setAmountVisible] = useState(false);
  const [rowsVisible, setRowsVisible] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Bosqichma-bosqich animatsiya
    const t1 = setTimeout(() => setShow(true), 50);
    const t2 = setTimeout(() => setCheckDone(true), 600);
    const t3 = setTimeout(() => setAmountVisible(true), 900);
    const t4 = setTimeout(() => setRowsVisible(true), 1100);
    // Konfetti
    const t5 = setTimeout(() => {
      const colors = ["#4ade80","#6366f1","#fbbf24","#f472b6","#60a5fa","#a78bfa","#34d399"];
      const pts = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: `${Math.random() * 100}vw`,
        color: colors[i % colors.length],
        delay: Math.random() * 0.8,
      }));
      setParticles(pts);
      setTimeout(() => setParticles([]), 3500);
    }, 500);
    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
  }, []);

  const fromNum = tx.from_card?.card_number || "";
  const toNum = tx.to_card?.card_number || "";
  const rows = [
    { label: "Tranzaksiya ID", value: tx.id || "—", mono: true },
    { label: "Sana",           value: fmtDate(tx.completed_at || tx.created_at) },
    { label: "Kimdan",         value: fromNum ? fromNum.match(/.{1,4}/g)?.join(" ") : "—", mono: true },
    { label: "Kimga",          value: toNum ? toNum.match(/.{1,4}/g)?.join(" ") : "—", mono: true },
    tx.description ? { label: "Izoh", value: tx.description } : null,
    { label: "Komissiya", value: Number(tx.commission) > 0 ? `${fmt(tx.commission)} so'm` : "Bepul ✓", valueColor: Number(tx.commission) > 0 ? "#fbbf24" : "#4ade80" },
    { label: "Status", value: "Muvaffaqiyatli ✓", valueColor: "#4ade80" },
  ].filter(Boolean);

  return (
    <>
      {/* Konfetti zarralar */}
      {particles.map(p => <Particle key={p.id} {...p} />)}

      <div style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(10px)",
        display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"20px",
        opacity: show ? 1 : 0, transition: "opacity 0.3s ease",
      }} onClick={onClose}>
        <div style={{
          background:"#0D0D22", border:"1px solid rgba(74,222,128,0.2)", borderRadius:"24px",
          width:"100%", maxWidth:"440px", overflow:"hidden",
          boxShadow:"0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(74,222,128,0.08)",
          transform: show ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }} onClick={e => e.stopPropagation()}>

          {/* Header — gradient yashil */}
          <div style={{ background:"linear-gradient(135deg,#052e16,#064e3b,#065f46)", padding:"36px 28px 28px", textAlign:"center", position:"relative", overflow:"hidden" }}>
            {/* Orqa glow */}
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 50% 60%, rgba(74,222,128,0.15) 0%, transparent 70%)", pointerEvents:"none" }} />

            {/* Checkmark doira */}
            <div style={{
              width:"72px", height:"72px", borderRadius:"50%", margin:"0 auto 16px",
              background:"rgba(74,222,128,0.12)", border:"2px solid rgba(74,222,128,0.4)",
              display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
              transform: checkDone ? "scale(1)" : "scale(0)",
              transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: checkDone ? "0 0 30px rgba(74,222,128,0.3)" : "none",
            }}>
              {/* Pulse ring */}
              {checkDone && <div style={{ position:"absolute", inset:"-8px", borderRadius:"50%", border:"2px solid rgba(74,222,128,0.2)", animation:"ringPulse 1.5s ease-out 3" }} />}
              <Check size={32} color="#4ade80" strokeWidth={3} />
            </div>

            <p style={{
              fontSize:"15px", fontWeight:600, color:"rgba(255,255,255,0.6)", marginBottom:"8px",
              opacity: amountVisible ? 1 : 0, transform: amountVisible ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.4s ease",
            }}>O'tkazma muvaffaqiyatli! 🎉</p>

            <p style={{
              fontSize:"40px", fontWeight:900, color:"#4ade80", lineHeight:1,
              opacity: amountVisible ? 1 : 0, transform: amountVisible ? "scale(1)" : "scale(0.8)",
              transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              textShadow: "0 0 30px rgba(74,222,128,0.4)",
            }}>{fmt(tx.amount)} so'm</p>

            <button onClick={onClose} style={{ position:"absolute", top:"14px", right:"14px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", width:"32px", height:"32px", cursor:"pointer", color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X size={15} />
            </button>
          </div>

          {/* Tishli separator */}
          <div style={{ background:"#065f46", lineHeight:0 }}>
            <svg viewBox="0 0 440 18" preserveAspectRatio="none" style={{ width:"100%", height:"18px", display:"block" }}>
              <path d="M0,0 Q11,18 22,0 Q33,18 44,0 Q55,18 66,0 Q77,18 88,0 Q99,18 110,0 Q121,18 132,0 Q143,18 154,0 Q165,18 176,0 Q187,18 198,0 Q209,18 220,0 Q231,18 242,0 Q253,18 264,0 Q275,18 286,0 Q297,18 308,0 Q319,18 330,0 Q341,18 352,0 Q363,18 374,0 Q385,18 396,0 Q407,18 418,0 Q429,18 440,0 L440,18 L0,18 Z" fill="#0D0D22" />
            </svg>
          </div>

          {/* Rows */}
          <div style={{ padding:"20px 28px 28px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {rows.map((row, i) => (
                <div key={i} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px",
                  opacity: rowsVisible ? 1 : 0,
                  transform: rowsVisible ? "translateX(0)" : "translateX(-12px)",
                  transition: `all 0.35s ease ${i * 0.06}s`,
                }}>
                  <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)", flexShrink:0 }}>{row.label}</span>
                  <span style={{ fontSize:"13px", fontWeight:700, color:row.valueColor||"white", fontFamily:row.mono?"monospace":"inherit", wordBreak:"break-all", textAlign:"right" }}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div style={{
                borderTop:"1px dashed rgba(255,255,255,0.1)", paddingTop:"14px",
                display:"flex", justifyContent:"space-between", alignItems:"center",
                opacity: rowsVisible ? 1 : 0, transition: "opacity 0.4s ease 0.5s",
              }}>
                <span style={{ fontSize:"15px", fontWeight:700, color:"rgba(255,255,255,0.5)" }}>Jami o'tkazildi</span>
                <span style={{ fontSize:"20px", fontWeight:900, color:"white" }}>{fmt(tx.amount)} so'm</span>
              </div>
            </div>

            <button onClick={onClose}
              style={{
                width:"100%", marginTop:"20px", padding:"14px",
                background:"linear-gradient(90deg,#6366f1,#8b5cf6)", border:"none",
                borderRadius:"12px", cursor:"pointer", color:"white", fontSize:"15px", fontWeight:700,
                opacity: rowsVisible ? 1 : 0, transition: "opacity 0.3s ease 0.6s",
                boxShadow:"0 8px 24px rgba(99,102,241,0.35)",
              }}
              onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
              Yopish
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function SavedCardDropdown({ savedCards, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = savedCards.filter(sc => {
    const q = search.toLowerCase();
    return (sc.alias || "").toLowerCase().includes(q) ||
           (sc.card_holder_name || "").toLowerCase().includes(q) ||
           (sc.card_number || "").includes(q);
  });

  const selected = savedCards.find(sc => sc.card_number === value);

  return (
    <div style={{ marginTop:"10px", position:"relative" }}>
      <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.28)", marginBottom:"6px" }}>Saqlangan kartalar:</p>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"rgba(99,102,241,0.06)", border:`1px solid ${open ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.18)"}`, borderRadius:"10px", cursor:"pointer", color:"white" }}>
        <span style={{ fontSize:"13px", color: selected ? "#a5b4fc" : "rgba(255,255,255,0.35)" }}>
          {selected ? `${selected.alias || selected.card_holder_name} 2022 00b700b700b700b7 ${selected.card_number?.slice(-4)}` : "Saqlangan kartani tanlang..."}
        </span>
        <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", transition:"transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>25bc</span>
      </button>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#0D0D22", border:"1px solid rgba(99,102,241,0.25)", borderRadius:"12px", zIndex:50, overflow:"hidden", boxShadow:"0 12px 40px rgba(0,0,0,0.6)" }}>
          <div style={{ padding:"10px" }}>
            <input autoFocus type="text" placeholder="Alias yoki ism bo'yicha izlash..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"8px 12px", fontSize:"12px", color:"white", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ maxHeight:"200px", overflowY:"auto" }}>
            {filtered.length === 0 ? (
              <p style={{ padding:"14px", fontSize:"12px", color:"rgba(255,255,255,0.25)", textAlign:"center" }}>Topilmadi</p>
            ) : filtered.map(sc => (
              <button key={sc.id} onClick={() => { onSelect(sc.card_number); setOpen(false); setSearch(""); }}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", background: value === sc.card_number ? "rgba(99,102,241,0.12)" : "transparent", border:"none", cursor:"pointer", textAlign:"left" }}
                onMouseEnter={e => { if(value !== sc.card_number) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if(value !== sc.card_number) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <CreditCard size={13} color="#818cf8" />
                  </div>
                  <div>
                    <p style={{ fontSize:"13px", fontWeight:700, color: value === sc.card_number ? "#a5b4fc" : "white", marginBottom:"1px" }}>
                      {sc.alias || sc.card_holder_name}
                    </p>
                    <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", fontFamily:"monospace" }}>
                      00b700b700b700b7 00b700b700b700b7 00b700b700b700b7 {sc.card_number?.slice(-4)}
                    </p>
                  </div>
                </div>
                {value === sc.card_number && <Check size={13} color="#6366f1" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SendMoneyPage() {
  const { user } = useAuthStore();
  const [cards, setCards] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [form, setForm] = useState({ from_card_id:"", to_card_number:"", amount:"", description:"" });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cr, sr] = await Promise.all([cardAPI.getAll(), savedCardAPI.getAll()]);
      const allCards = cr.data || [];
      const active = allCards.filter(c => c.status?.toUpperCase() === "ACTIVE");
      setCards(active);
      setSavedCards(sr.data?.data || []);
      if (active.length > 0) setForm(f => ({ ...f, from_card_id: active[0].id }));
    } catch (e) { console.error(e); }
    finally { setFetching(false); }
  };

  const selectedCard = cards.find(c => c.id === form.from_card_id);
  const amount = parseFloat(form.amount) || 0;
  // Komissiya: faqat oddiy user uchun. ADMIN va PREMIUM to'lamaydi
  const userRole = user?.role?.toUpperCase();
  const isPremium = userRole === "PREMIUM" || userRole === "ADMIN";
  const commission = amount > 0 && !isPremium ? Math.round(amount * 0.01) : 0;
  const total = amount + commission;

  const handleSubmit = async () => {
    if (!form.from_card_id) { setError("Karta tanlang"); return; }
    if (form.to_card_number.length !== 16) { setError("16 raqamli karta raqam kiriting"); return; }
    if (amount < 1000) { setError("Minimal miqdor: 1,000 so'm"); return; }
    if (selectedCard && total > parseFloat(selectedCard.balance)) { setError("Hisobda yetarli mablag' yo'q"); return; }
    setLoading(true); setError("");
    try {
      const res = await transactionAPI.send({
        from_card_id: form.from_card_id,
        to_card_number: form.to_card_number,
        amount,
        description: form.description || null,
      });
      setReceipt(res.data);
      setForm(f => ({ ...f, to_card_number:"", amount:"", description:"" }));
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally { setLoading(false); }
  };

  const iStyle = { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", padding:"13px 16px", fontSize:"14px", color:"white", outline:"none", boxSizing:"border-box" };
  const lStyle = { display:"block", fontSize:"12px", fontWeight:600, color:"rgba(255,255,255,0.38)", marginBottom:"8px", letterSpacing:"0.05em", textTransform:"uppercase" };

  if (fetching) return (
    <div style={{ display:"flex", justifyContent:"center", padding:"80px" }}>
      <div style={{ width:"32px", height:"32px", border:"3px solid rgba(99,102,241,0.3)", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes confettiFall{
          0%{opacity:1;transform:translateY(0) translateX(0) rotate(0)}
          100%{opacity:0;transform:translateY(100vh) translateX(var(--x-end)) rotate(var(--rotate-end))}
        }
        @keyframes ringPulse{
          0%{opacity:0.8;transform:scale(1)}
          100%{opacity:0;transform:scale(1.6)}
        }
      `}</style>
    </div>
  );

  return (
    <div style={{ width:"100%" }}>
      {receipt && <ReceiptModal tx={receipt} onClose={() => setReceipt(null)} />}
      <h1 style={{ fontSize:"26px", fontWeight:800, color:"white", marginBottom:"24px", animation:"slideUp 0.4s ease-out both" }}>Pul yuborish</h1>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:"24px", alignItems:"start" }}>
        <div style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"28px", display:"flex", flexDirection:"column", gap:"20px", animation:"slideUp 0.45s ease-out 0.05s both" }}>

          <div>
            <label style={lStyle}>Qaysi kartadan</label>
            {cards.length === 0 ? (
              <div style={{ padding:"13px 16px", background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:"12px", fontSize:"13px", color:"#f87171" }}>
                Faol kartangiz yo'q. Avval karta yarating yoki muzlatilgan kartani faollashtiring.
              </div>
            ) : (
              <select value={form.from_card_id} onChange={e => setForm({ ...form, from_card_id: e.target.value })}
                style={{ ...iStyle, cursor:"pointer" }}>
                {cards.map(c => (
                  <option key={c.id} value={c.id} style={{ background:"#0D0D22" }}>
                    {getNum(c)} — {fmt(c.balance)} so'm
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label style={lStyle}>Qaysi kartaga</label>
            <input type="text" inputMode="numeric" placeholder="1234567890123456"
              value={form.to_card_number}
              onChange={e => setForm({ ...form, to_card_number: e.target.value.replace(/\D/g,"").slice(0,16) })}
              style={{ ...iStyle, fontFamily:"monospace", letterSpacing:"0.08em" }} />
            <p style={{ fontSize:"11px", color: form.to_card_number.length === 16 ? "#4ade80" : "rgba(255,255,255,0.2)", marginTop:"5px" }}>
              {form.to_card_number.length}/16 raqam
            </p>
            {savedCards.length > 0 && (
              <SavedCardDropdown
                savedCards={savedCards}
                value={form.to_card_number}
                onSelect={num => setForm({ ...form, to_card_number: num })}
              />
            )}
          </div>

          <div>
            <label style={lStyle}>Miqdor (so'm)</label>
            <input type="number" placeholder="Miqdorni kiriting" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} style={iStyle} />
            {amount > 0 && (
              <div style={{ marginTop:"10px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"12px 14px", display:"flex", flexDirection:"column", gap:"7px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px" }}>
                  <span style={{ color:"rgba(255,255,255,0.38)" }}>Miqdor</span>
                  <span style={{ color:"white", fontWeight:600 }}>{fmt(amount)} so'm</span>
                </div>
                {commission > 0 ? (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px" }}>
                    <span style={{ color:"rgba(245,158,11,0.7)" }}>Komissiya (1%)</span>
                    <span style={{ color:"#fbbf24", fontWeight:600 }}>{fmt(commission)} so'm</span>
                  </div>
                ) : (
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px" }}>
                    <span style={{ color:"rgba(74,222,128,0.7)" }}>Komissiya</span>
                    <span style={{ color:"#4ade80", fontWeight:600 }}>Bepul (Premium)</span>
                  </div>
                )}
                <div style={{ height:"1px", background:"rgba(255,255,255,0.07)" }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"14px" }}>
                  <span style={{ color:"rgba(255,255,255,0.55)", fontWeight:700 }}>Jami yechiladi</span>
                  <span style={{ color:"white", fontWeight:900 }}>{fmt(total)} so'm</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={lStyle}>Izoh (ixtiyoriy)</label>
            <input type="text" placeholder="Izoh: " value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} style={iStyle} />
          </div>

          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(239,68,68,0.09)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:"12px", padding:"12px 15px", fontSize:"13px", color:"#f87171" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || cards.length === 0}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%", background: loading || cards.length === 0 ? "rgba(99,102,241,0.35)" : "linear-gradient(90deg,#6366f1,#8b5cf6)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:700, color:"white", cursor: loading || cards.length === 0 ? "not-allowed" : "pointer", boxShadow:"0 4px 16px rgba(99,102,241,0.28)", transition:"all 0.2s" }}
            onMouseEnter={e => { if(!loading && cards.length > 0) { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(99,102,241,0.45)"; }}}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(99,102,241,0.28)"; }}>
            {loading ? <Loader size={16} style={{ animation:"spin 0.8s linear infinite" }} /> : <Send size={16} />}
            {loading ? "Yuborilmoqda..." : "Yuborish"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </div>

        <div style={{ position:"sticky", top:"84px" }}>
          {selectedCard ? (
            <div
              onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-0.5; const y=(e.clientY-r.top)/r.height-0.5; e.currentTarget.style.transform=`perspective(600px) rotateY(${x*12}deg) rotateX(${-y*12}deg) scale(1.02)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform="perspective(600px) rotateY(0) rotateX(0) scale(1)"; }}
              style={{ borderRadius:"20px", padding:"24px 26px", position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#1e1b4b,#3730a3,#4f46e5)", boxShadow:"0 16px 48px rgba(99,102,241,0.35)", transition:"transform 0.15s ease" }}>
              <div style={{ position:"absolute", top:"-30px", right:"-30px", width:"140px", height:"140px", background:"rgba(255,255,255,0.06)", borderRadius:"50%", pointerEvents:"none" }} />
              <div style={{ position:"relative" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"20px" }}>
                  <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <CreditCard size={14} color="white" />
                  </div>
                  <span style={{ fontSize:"13px", fontWeight:600, color:"rgba(255,255,255,0.7)" }}>Cho'ntak</span>
                </div>
                <p style={{ fontSize:"13px", fontFamily:"monospace", color:"rgba(255,255,255,0.5)", letterSpacing:"0.1em", marginBottom:"16px" }}>
                  {getNum(selectedCard).match(/.{1,4}/g)?.join(" ") || "•••• •••• •••• ••••"}
                </p>
                <div>
                  <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.07em" }}>Balans</p>
                  <p style={{ fontSize:"24px", fontWeight:900, color:"white" }}>{fmt(selectedCard.balance)} so'm</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background:"#0D0D22", border:"2px dashed rgba(255,255,255,0.08)", borderRadius:"20px", padding:"48px", textAlign:"center" }}>
              <CreditCard size={32} color="rgba(255,255,255,0.15)" style={{ margin:"0 auto 10px" }} />
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"13px" }}>Karta tanlanmagan</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes confettiFall{
          0%{opacity:1;transform:translateY(0) translateX(0) rotate(0)}
          100%{opacity:0;transform:translateY(100vh) translateX(var(--x-end)) rotate(var(--rotate-end))}
        }
        @keyframes ringPulse{
          0%{opacity:0.8;transform:scale(1)}
          100%{opacity:0;transform:scale(1.6)}
        }
      `}</style>
    </div>
  );
}
