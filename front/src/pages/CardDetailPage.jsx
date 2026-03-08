import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cardAPI } from "../api";
import { ArrowLeft, Snowflake, Play, Loader, CreditCard, AlertTriangle, Eye, EyeOff, Wifi } from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }
function getCardNumber(card) { return card?.card_number || card?.number || card?.pan || card?.cardNumber || ""; }
function getExpiry(card) {
  const raw = card?.expiry_date || card?.expiry || card?.expire_date || card?.expireDate || "";
  if (!raw) return "••/••";
  if (raw.includes("-")) { const d = new Date(raw); return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`; }
  return raw;
}

// ─── MUZ KRISTALL SVG ──────────────────────────────────────────────────────
function IceCrystal({ x, y, size, rotation, opacity, delay, animDur }) {
  return (
    <div style={{ position:"absolute", left:`${x}%`, top:`${y}%`, pointerEvents:"none", zIndex:1, opacity,
      animation:`crFloat ${animDur}s ease-in-out ${delay}s infinite alternate`,
      transform:`rotate(${rotation}deg)`,
      filter:"drop-shadow(0 0 5px rgba(147,197,253,0.7))" }}>
      <svg viewBox="0 0 40 40" fill="none" width={size} height={size}>
        <line x1="20" y1="2"  x2="20" y2="38" stroke="rgba(186,230,253,0.85)" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="2"  y1="20" x2="38" y2="20" stroke="rgba(186,230,253,0.85)" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="7"  y1="7"  x2="33" y2="33" stroke="rgba(147,197,253,0.65)" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="33" y1="7"  x2="7"  y2="33" stroke="rgba(147,197,253,0.65)" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="3.5" fill="rgba(219,234,254,0.9)"/>
        <circle cx="20" cy="20" r="1.8" fill="rgba(255,255,255,0.98)"/>
        <circle cx="20" cy="4"  r="2"   fill="rgba(191,219,254,0.82)"/>
        <line x1="20" y1="4"  x2="15" y2="10" stroke="rgba(147,197,253,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="20" y1="4"  x2="25" y2="10" stroke="rgba(147,197,253,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="20" y1="4"  x2="16" y2="7"  stroke="rgba(147,197,253,0.5)" strokeWidth="0.8" strokeLinecap="round"/>
        <line x1="20" y1="4"  x2="24" y2="7"  stroke="rgba(147,197,253,0.5)" strokeWidth="0.8" strokeLinecap="round"/>
        <circle cx="20" cy="36" r="2"  fill="rgba(191,219,254,0.82)"/>
        <line x1="20" y1="36" x2="15" y2="30" stroke="rgba(147,197,253,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="20" y1="36" x2="25" y2="30" stroke="rgba(147,197,253,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="4"  cy="20" r="2"  fill="rgba(191,219,254,0.82)"/>
        <line x1="4"  y1="20" x2="10" y2="15" stroke="rgba(147,197,253,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="4"  y1="20" x2="10" y2="25" stroke="rgba(147,197,253,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="36" cy="20" r="2"  fill="rgba(191,219,254,0.82)"/>
        <line x1="36" y1="20" x2="30" y2="15" stroke="rgba(147,197,253,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="36" y1="20" x2="30" y2="25" stroke="rgba(147,197,253,0.7)" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="9"  cy="9"  r="1.5" fill="rgba(191,219,254,0.6)"/>
        <circle cx="31" cy="9"  r="1.5" fill="rgba(191,219,254,0.6)"/>
        <circle cx="9"  cy="31" r="1.5" fill="rgba(191,219,254,0.6)"/>
        <circle cx="31" cy="31" r="1.5" fill="rgba(191,219,254,0.6)"/>
        <line x1="20" y1="13" x2="16" y2="10" stroke="rgba(147,197,253,0.4)" strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="20" y1="13" x2="24" y2="10" stroke="rgba(147,197,253,0.4)" strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="20" y1="27" x2="16" y2="30" stroke="rgba(147,197,253,0.4)" strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="20" y1="27" x2="24" y2="30" stroke="rgba(147,197,253,0.4)" strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="13" y1="20" x2="10" y2="16" stroke="rgba(147,197,253,0.4)" strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="13" y1="20" x2="10" y2="24" stroke="rgba(147,197,253,0.4)" strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="27" y1="20" x2="30" y2="16" stroke="rgba(147,197,253,0.4)" strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="27" y1="20" x2="30" y2="24" stroke="rgba(147,197,253,0.4)" strokeWidth="0.7" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

export default function CardDetailPage() {
  const { cardId } = useParams();
  const navigate   = useNavigate();
  const [card, setCard]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [visible, setVisible]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const tiltRef = useRef(null);

  useEffect(() => { fetchCard(); }, [cardId]);

  const fetchCard = async () => {
    setLoading(true);
    try { const res = await cardAPI.getOne(cardId); setCard(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showMsg = (text, type="ok") => {
    if (type==="ok") setSuccess(text); else setError(text);
    setTimeout(()=>{ setSuccess(""); setError(""); }, 3000);
  };

  const handleAction = async () => {
    setActionLoading(true);
    try {
      if (card.status==="ACTIVE")  { await cardAPI.freeze(card.id);   showMsg("Karta muzlatildi! ❄️"); }
      else if (card.status==="FROZEN") { await cardAPI.unfreeze(card.id); showMsg("Karta faollashtirildi! ✅"); }
      await fetchCard();
    } catch(e) { showMsg(e.response?.data?.detail||"Xatolik","err"); }
    finally { setActionLoading(false); }
  };

  const onMouseMove = (e) => {
    if (!tiltRef.current) return;
    const r = tiltRef.current.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width  - 0.5;
    const y = (e.clientY-r.top) /r.height - 0.5;
    tiltRef.current.style.transform = `perspective(900px) rotateY(${x*15}deg) rotateX(${-y*15}deg) scale(1.03)`;
  };
  const onMouseLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "perspective(900px) rotateY(0) rotateX(0) scale(1)";
  };

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", padding:"80px" }}>
      <div style={{ width:"32px", height:"32px", border:"3px solid rgba(99,102,241,0.3)", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!card) return (
    <div style={{ textAlign:"center", padding:"60px" }}>
      <div style={{ width:"56px", height:"56px", borderRadius:"16px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        <CreditCard size={24} color="#f87171"/>
      </div>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"15px", fontWeight:600, marginBottom:"8px" }}>Karta topilmadi</p>
      {error && <p style={{ color:"#f87171", fontSize:"13px", marginBottom:"16px" }}>{error}</p>}
      <button onClick={()=>navigate("/cards")} style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"10px 18px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"10px", color:"#818cf8", cursor:"pointer", fontSize:"14px", fontWeight:600 }}>
        ← Kartalarimga qaytish
      </button>
    </div>
  );

  const isActive = card.status === "ACTIVE";
  const isFrozen = card.status === "FROZEN";
  const isClosed = card.status === "CLOSED";
  const num = getCardNumber(card);
  const exp = getExpiry(card);

  const statusConfig = {
    ACTIVE: { label:"Faol",        color:"#a78bfa", bg:"rgba(167,139,250,0.15)", border:"rgba(167,139,250,0.3)" },
    FROZEN: { label:"Muzlatilgan", color:"#93c5fd", bg:"rgba(147,197,253,0.15)", border:"rgba(147,197,253,0.3)" },
    CLOSED: { label:"Yopilgan",    color:"#f87171", bg:"rgba(248,113,113,0.12)", border:"rgba(248,113,113,0.25)" },
  };
  const st = statusConfig[card.status] || statusConfig["ACTIVE"];

  const cardBg = isClosed
    ? "linear-gradient(135deg,#1a1a2e,#16213e)"
    : isFrozen
    ? "linear-gradient(160deg,#071428 0%,#0f2748 25%,#1a3d70 55%,#0c1e42 100%)"
    : "linear-gradient(145deg,#130824 0%,#270f5c 30%,#3d1885 60%,#1a0a40 100%)";
  const cardGlow = isClosed ? "none"
    : isFrozen ? "0 20px 60px rgba(20,80,180,0.55), 0 0 0 1px rgba(147,197,253,0.12)"
    : "0 20px 60px rgba(80,20,200,0.6),  0 0 0 1px rgba(167,139,250,0.14)";

  const crystals = isFrozen ? [
    {x:4,  y:6,  size:28,rotation:0,  opacity:0.92,delay:0,  animDur:2.8},
    {x:72, y:4,  size:22,rotation:30, opacity:0.78,delay:0.4,animDur:3.2},
    {x:86, y:52, size:30,rotation:60, opacity:0.88,delay:0.7,animDur:2.5},
    {x:3,  y:62, size:18,rotation:15, opacity:0.65,delay:1.0,animDur:3.5},
    {x:44, y:2,  size:16,rotation:45, opacity:0.60,delay:0.2,animDur:2.9},
    {x:58, y:78, size:24,rotation:20, opacity:0.80,delay:0.8,animDur:3.1},
    {x:20, y:82, size:16,rotation:75, opacity:0.55,delay:1.2,animDur:2.6},
    {x:90, y:22, size:20,rotation:50, opacity:0.72,delay:0.5,animDur:3.3},
    {x:32, y:14, size:13,rotation:10, opacity:0.50,delay:1.5,animDur:2.7},
    {x:64, y:40, size:11,rotation:80, opacity:0.45,delay:0.9,animDur:3.6},
  ] : [];

  const grapes = isActive ? Array.from({length:16},(_,i)=>({
    id:i, x:5+(i%5)*19+(i%3)*3, y:8+Math.floor(i/5)*26+(i%2)*5,
    size:5+(i%4)*2.5, delay:i*0.09, opacity:0.35+(i%4)*0.12,
  })) : [];

  return (
    <div style={{ maxWidth:"480px" }}>
      <button onClick={()=>navigate("/cards")}
        style={{ display:"flex", alignItems:"center", gap:"8px", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", fontSize:"14px", marginBottom:"24px", padding:0, transition:"color 0.2s" }}
        onMouseEnter={e=>e.currentTarget.style.color="white"}
        onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.4)"}>
        <ArrowLeft size={16}/> Kartalarim
      </button>

      <h1 style={{ fontSize:"26px", fontWeight:800, color:"white", marginBottom:"24px" }}>Karta boshqaruvi</h1>

      {/* ─── Karta ─── */}
      <div ref={tiltRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        style={{ marginBottom:"16px", transition:"transform 0.18s ease", animation:"cardFloat 4.5s ease-in-out infinite", willChange:"transform" }}>

        <div style={{ borderRadius:"24px", padding:"26px 28px", position:"relative", overflow:"hidden",
          background:cardBg, opacity:isClosed?0.6:1, boxShadow:cardGlow,
          transition:"background 1s ease, box-shadow 1s ease" }}>

          {/* FROZEN */}
          {isFrozen && (<>
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
              background:"radial-gradient(ellipse at 15% 20%,rgba(147,197,253,0.10) 0%,transparent 45%),radial-gradient(ellipse at 85% 75%,rgba(186,230,253,0.08) 0%,transparent 40%)" }}/>
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
              background:"linear-gradient(180deg,rgba(186,230,253,0.06) 0%,transparent 45%,rgba(147,197,253,0.05) 100%)",
              animation:"icePulse 3.5s ease-in-out infinite" }}/>
            {crystals.map((cr,i)=><IceCrystal key={i} {...cr}/>)}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:3, pointerEvents:"none" }}>
              <div style={{ textAlign:"center", background:"rgba(7,20,40,0.72)", borderRadius:"18px", padding:"11px 26px", backdropFilter:"blur(8px)", border:"1px solid rgba(147,197,253,0.24)", boxShadow:"0 4px 24px rgba(30,80,180,0.35)" }}>
                <Snowflake size={22} color="#93c5fd" style={{ margin:"0 auto 5px", animation:"spinSlow 8s linear infinite", filter:"drop-shadow(0 0 7px rgba(147,197,253,0.6))" }}/>
                <p style={{ fontSize:"10px", fontWeight:800, color:"#93c5fd", letterSpacing:"0.24em" }}>MUZLATILGAN</p>
              </div>
            </div>
          </>)}

          {/* ACTIVE — uzum */}
          {isActive && (
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0,
                background:"radial-gradient(ellipse at 75% 15%,rgba(167,139,250,0.18) 0%,transparent 55%),radial-gradient(ellipse at 15% 85%,rgba(124,58,237,0.14) 0%,transparent 50%)" }}/>
              {grapes.map(g=>(
                <div key={g.id} style={{ position:"absolute", left:`${g.x}%`, top:`${g.y}%`,
                  width:`${g.size}px`, height:`${g.size}px`, borderRadius:"50%",
                  background:"radial-gradient(circle at 32% 32%,rgba(216,180,254,0.72),rgba(109,40,217,0.45))",
                  boxShadow:`0 0 ${g.size*1.2}px rgba(139,92,246,0.28),inset 0 1px 0 rgba(255,255,255,0.18)`,
                  opacity:g.opacity, animation:`grapeFloat ${2.8+g.delay}s ease-in-out ${g.delay}s infinite alternate` }}/>
              ))}
              <div style={{ position:"absolute", top:0, left:"-60%", width:"40%", height:"100%",
                background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.07),transparent)",
                animation:"cardSheen 5s ease-in-out infinite" }}/>
            </div>
          )}

          <div style={{ position:"absolute", top:"-50px", right:"-50px", width:"200px", height:"200px",
            background:isFrozen?"rgba(186,230,253,0.05)":"rgba(139,92,246,0.07)",
            borderRadius:"50%", pointerEvents:"none", zIndex:1 }}/>

          {/* Kontent */}
          <div style={{ position:"relative", zIndex:4 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"26px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"32px", height:"32px", borderRadius:"8px",
                  background:isFrozen?"rgba(147,197,253,0.15)":"rgba(167,139,250,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:isFrozen?"0 0 12px rgba(147,197,253,0.22)":"0 0 12px rgba(139,92,246,0.22)" }}>
                  <CreditCard size={15} color="white"/>
                </div>
                <span style={{ fontSize:"13px", fontWeight:600,
                  color:isFrozen?"rgba(186,230,253,0.9)":"rgba(221,214,254,0.9)" }}>Cho'ntak</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"5px", padding:"4px 10px", background:st.bg, border:`1px solid ${st.border}`, borderRadius:"999px" }}>
                  <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:st.color }}/>
                  <span style={{ fontSize:"11px", fontWeight:700, color:st.color }}>{st.label}</span>
                </div>
                <Wifi size={16} color={isFrozen?"rgba(147,197,253,0.52)":"rgba(167,139,250,0.52)"} style={{ transform:"rotate(90deg)" }}/>
              </div>
            </div>

            <p style={{ fontSize:"21px", fontWeight:900, color:"white", fontFamily:"'Courier New',monospace",
              letterSpacing:"0.22em", marginBottom:"24px",
              textShadow:isFrozen?"0 0 28px rgba(147,197,253,0.55),0 2px 6px rgba(0,0,0,0.4)":"0 0 28px rgba(139,92,246,0.55),0 2px 6px rgba(0,0,0,0.4)" }}>
              {visible?(num.length===16?num.match(/.{1,4}/g)?.join("   "):num||"•••• •••• •••• ••••"):`•••• •••• •••• ${num.slice(-4)||"••••"}`}
            </p>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
              <div>
                <p style={{ fontSize:"10px", color:isFrozen?"rgba(147,197,253,0.52)":"rgba(167,139,250,0.58)", marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.1em" }}>Balans</p>
                <p style={{ fontSize:"22px", fontWeight:900, color:visible?"white":"rgba(255,255,255,0.22)", transition:"color 0.3s" }}>
                  {visible?`${fmt(card.balance)} so'm`:"••••••••"}
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:"10px", color:isFrozen?"rgba(147,197,253,0.52)":"rgba(167,139,250,0.58)", marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.1em" }}>Muddati</p>
                <p style={{ fontSize:"14px", fontWeight:700, fontFamily:"monospace", transition:"color 0.3s",
                  color:visible?(isFrozen?"rgba(186,230,253,0.88)":"rgba(221,214,254,0.88)"):"rgba(255,255,255,0.18)" }}>
                  {visible?exp:"••/••"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ko'rish tugmasi */}
      <button onClick={()=>setVisible(!visible)}
        style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 16px",
          background:visible?"rgba(99,102,241,0.1)":"rgba(255,255,255,0.05)",
          border:`1px solid ${visible?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.1)"}`,
          borderRadius:"10px", cursor:"pointer",
          color:visible?"#a5b4fc":"rgba(255,255,255,0.4)", fontSize:"13px", fontWeight:600, marginBottom:"16px", transition:"all 0.2s" }}>
        {visible?<EyeOff size={14}/>:<Eye size={14}/>}
        {visible?"Ma'lumotlarni yashirish":"Ma'lumotlarni ko'rsatish"}
      </button>

      {error   && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"12px", padding:"12px 16px", marginBottom:"16px", fontSize:"13px", color:"#f87171" }}>{error}</div>}
      {success && <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:"12px", padding:"12px 16px", marginBottom:"16px", fontSize:"13px", color:"#4ade80" }}>{success}</div>}

      {/* Amallar */}
      {!isClosed && (
        <div style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"20px", padding:"20px" }}>
          <p style={{ fontSize:"12px", fontWeight:600, color:"rgba(255,255,255,0.35)", marginBottom:"14px", textTransform:"uppercase", letterSpacing:"0.06em" }}>Amallar</p>
          <button onClick={handleAction} disabled={actionLoading}
            style={{ display:"flex", alignItems:"center", gap:"14px", padding:"16px 18px", borderRadius:"14px",
              background:isActive?"rgba(96,165,250,0.07)":"rgba(74,222,128,0.07)",
              border:`1px solid ${isActive?"rgba(96,165,250,0.18)":"rgba(74,222,128,0.18)"}`,
              cursor:actionLoading?"not-allowed":"pointer", width:"100%", opacity:actionLoading?0.6:1, transition:"all 0.2s" }}
            onMouseEnter={e=>{if(!actionLoading)e.currentTarget.style.opacity="0.8";}}
            onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>
            <div style={{ width:"42px", height:"42px", borderRadius:"12px",
              background:isActive?"rgba(96,165,250,0.12)":"rgba(74,222,128,0.12)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {actionLoading
                ? <Loader size={18} color={isActive?"#60a5fa":"#4ade80"} style={{ animation:"spin 0.8s linear infinite" }}/>
                : isActive ? <Snowflake size={18} color="#60a5fa"/> : <Play size={18} color="#4ade80"/>}
            </div>
            <div style={{ textAlign:"left" }}>
              <p style={{ fontSize:"14px", fontWeight:700, color:"white" }}>{isActive?"Kartani muzlatish":"Kartani faollashtirish"}</p>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)", marginTop:"2px" }}>{isActive?"Barcha operatsiyalar to'xtatiladi":"Karta yana ishlay boshlaydi"}</p>
            </div>
          </button>

          {isActive && (
            <div style={{ display:"flex", gap:"10px", padding:"12px 14px", background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.12)", borderRadius:"12px", marginTop:"12px" }}>
              <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink:0, marginTop:"1px" }}/>
              <p style={{ fontSize:"12px", color:"rgba(245,158,11,0.65)", lineHeight:1.5 }}>
                Kartani muzlatish barcha to'lovlar va o'tkazmalarni vaqtincha bloklaydi.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin      { from{transform:rotate(0)}  to{transform:rotate(360deg)} }
        @keyframes spinSlow  { from{transform:rotate(0)}  to{transform:rotate(360deg)} }
        @keyframes cardFloat { 0%,100%{transform:translateY(0) rotateZ(-0.5deg)} 50%{transform:translateY(-8px) rotateZ(0.5deg)} }
        @keyframes crFloat   { 0%{transform:rotate(0deg) translateY(0) scale(1);filter:drop-shadow(0 0 4px rgba(147,197,253,0.6))} 100%{transform:rotate(18deg) translateY(-7px) scale(1.12);filter:drop-shadow(0 0 10px rgba(186,230,253,0.95))} }
        @keyframes icePulse  { 0%,100%{opacity:0.55} 50%{opacity:1} }
        @keyframes grapeFloat{ 0%{transform:translateY(0) scale(1)} 100%{transform:translateY(-6px) scale(1.1)} }
        @keyframes cardSheen { 0%{left:-60%} 60%,100%{left:120%} }
      `}</style>
    </div>
  );
}
