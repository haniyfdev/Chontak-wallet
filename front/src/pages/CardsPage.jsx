import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cardAPI } from "../api";
import { CreditCard, Plus, Snowflake, Play, Loader, Edit3, Wifi, Eye, EyeOff, Sparkles } from "lucide-react";

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

// ─── 3D REVEAL MODAL ───────────────────────────────────────────────────────
function CardRevealModal({ card, onClose }) {
  const [phase, setPhase] = useState("loading");
  const [timer, setTimer] = useState(12);
  const [flipped, setFlipped] = useState(false);
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setPhase("reveal");
          setTimeout(() => {
            setFlipped(true);
            setParticles(Array.from({ length: 24 }, (_, i) => ({
              id:i, x:Math.random()*100, y:Math.random()*100,
              size:Math.random()*8+4,
              color:["#a5b4fc","#c084fc","#818cf8","#fbbf24","#4ade80","#60a5fa","#f0abfc"][Math.floor(Math.random()*7)],
              duration:Math.random()*1.4+0.8, delay:Math.random()*0.5,
              dx:(Math.random()-0.5)*220, dy:(Math.random()-0.5)*220,
            })));
          }, 800);
          return 0;
        }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const num = getCardNumber(card);
  const exp = getExpiry(card);
  const progress = ((12-timer)/12)*100;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,0.93)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"28px" }}>
      {particles.map(p => (
        <div key={p.id} style={{ position:"absolute", left:`${p.x}%`, top:`${p.y}%`, width:`${p.size}px`, height:`${p.size}px`, borderRadius:"50%", background:p.color, pointerEvents:"none", animation:`particleBurst ${p.duration}s ease-out ${p.delay}s both`, "--dx":`${p.dx}px`, "--dy":`${p.dy}px` }}/>
      ))}

      {phase==="loading" && (<>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:"11px", fontWeight:700, color:"rgba(165,180,252,0.5)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"8px" }}>Kartangiz tayyorlanmoqda</p>
          <h2 style={{ fontSize:"26px", fontWeight:900, color:"white" }}>Biroz kuting...</h2>
        </div>
        <div style={{ width:"300px", height:"185px", borderRadius:"22px", background:"linear-gradient(135deg,#130824,#270f5c,#3d1885)", boxShadow:"0 0 60px rgba(88,28,220,0.5)", display:"flex", alignItems:"center", justifyContent:"center", animation:"modalCardFloat 2s ease-in-out infinite", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.08) 50%,transparent 60%)", backgroundSize:"200% 100%", animation:"shimmer 1.6s linear infinite" }}/>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:"44px", height:"44px", borderRadius:"50%", border:"3px solid rgba(165,180,252,0.3)", borderTopColor:"#a5b4fc", margin:"0 auto 10px", animation:"spin 1s linear infinite" }}/>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"12px", fontWeight:600 }}>Ishlov berilmoqda</p>
          </div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ position:"relative", width:"72px", height:"72px", margin:"0 auto 10px" }}>
            <svg viewBox="0 0 72 72" style={{ width:"72px", height:"72px", transform:"rotate(-90deg)" }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="5"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke="#7c3aed" strokeWidth="5"
                strokeDasharray={`${2*Math.PI*30}`} strokeDashoffset={`${2*Math.PI*30*(1-progress/100)}`}
                strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.9s linear" }}/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:"20px", fontWeight:900, color:"white" }}>{timer}</span>
            </div>
          </div>
          <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>soniya qoldi</p>
        </div>
      </>)}

      {(phase==="reveal"||phase==="done") && (<>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:"11px", fontWeight:700, color:"#4ade80", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"6px", animation:"fadeInUp 0.5s ease both" }}>✦ Muvaffaqiyatli yaratildi</p>
          <h2 style={{ fontSize:"26px", fontWeight:900, color:"white", animation:"fadeInUp 0.5s ease 0.1s both" }}>Kartangiz tayyor! 🎉</h2>
        </div>
        <div style={{ perspective:"1000px", width:"460px", height:"280px" }}>
          <div style={{ width:"100%", height:"100%", position:"relative", transformStyle:"preserve-3d", transform:flipped?"rotateY(0deg)":"rotateY(-180deg)", transition:"transform 1s cubic-bezier(0.175,0.885,0.32,1.275)" }}>
            <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", borderRadius:"22px", padding:"26px 30px", background:"linear-gradient(145deg,#130824,#270f5c,#3d1885)", boxShadow:"0 24px 60px rgba(80,20,200,0.5), 0 0 0 1px rgba(167,139,250,0.15)" }}>
              <div style={{ position:"absolute", inset:0, borderRadius:"22px", background:"linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.1) 50%,transparent 60%)", animation:flipped?"shine 1.5s ease 0.5s both":"none", pointerEvents:"none" }}/>
              <div style={{ position:"absolute", top:"-40px", right:"-40px", width:"180px", height:"180px", background:"rgba(139,92,246,0.07)", borderRadius:"50%", pointerEvents:"none" }}/>
              <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <div style={{ width:"34px", height:"34px", borderRadius:"9px", background:"rgba(167,139,250,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}><CreditCard size={16} color="white"/></div>
                    <span style={{ fontSize:"14px", fontWeight:700, color:"rgba(221,214,254,0.88)" }}>Cho'ntak</span>
                  </div>
                  <Wifi size={20} color="rgba(167,139,250,0.5)" style={{ transform:"rotate(90deg)" }}/>
                </div>
                <p style={{ fontSize:"15px", fontWeight:900, color:"white", fontFamily:"monospace", letterSpacing:"0.18em", textShadow:"0 0 20px rgba(139,92,246,0.5)" }}>
                  {num.length===16 ? num.match(/.{1,4}/g)?.join("  ") : num}
                </p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                  <div>
                    <p style={{ fontSize:"10px", color:"rgba(167,139,250,0.55)", marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.1em" }}>Balans</p>
                    <p style={{ fontSize:"17px", fontWeight:900, color:"white" }}>{fmt(card.balance)} so'm</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:"10px", color:"rgba(167,139,250,0.55)", marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.1em" }}>Muddati</p>
                    <p style={{ fontSize:"14px", fontWeight:700, color:"rgba(221,214,254,0.85)", fontFamily:"monospace" }}>{exp}</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position:"absolute", inset:0, backfaceVisibility:"hidden", transform:"rotateY(180deg)", borderRadius:"22px", background:"linear-gradient(135deg,#270f5c,#130824)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"50%", border:"3px solid rgba(165,180,252,0.3)", borderTopColor:"#a5b4fc", animation:"spin 1s linear infinite" }}/>
            </div>
          </div>
        </div>
        {flipped && (
          <button onClick={onClose} style={{ padding:"13px 36px", background:"linear-gradient(90deg,#6366f1,#8b5cf6)", border:"none", borderRadius:"14px", cursor:"pointer", color:"white", fontSize:"14px", fontWeight:800, boxShadow:"0 8px 24px rgba(99,102,241,0.4)", animation:"fadeInUp 0.5s ease 0.8s both", display:"flex", alignItems:"center", gap:"8px" }}>
            <Sparkles size={16}/> Kartani ko'rish
          </button>
        )}
      </>)}

      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes modalCardFloat{0%,100%{transform:translateY(0) rotateZ(-1deg)}50%{transform:translateY(-10px) rotateZ(1deg)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes shine{0%{opacity:0;transform:translateX(-100%) skewX(-15deg)}50%{opacity:1}100%{opacity:0;transform:translateX(200%) skewX(-15deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes particleBurst{0%{opacity:1;transform:scale(1) translate(0,0)}100%{opacity:0;transform:scale(0) translate(var(--dx),var(--dy))}}
      `}</style>
    </div>
  );
}

// ─── PHYSICAL CARD ──────────────────────────────────────────────────────────
function PhysicalCard({ card, visible, onToggleVisible, onAction, actionLoading, onEdit }) {
  const isActive = card.status?.toUpperCase() === "ACTIVE";
  const isFrozen = card.status?.toUpperCase() === "FROZEN";
  const isClosed = card.status?.toUpperCase() === "CLOSED";
  const num = getCardNumber(card);
  const exp = getExpiry(card);
  const tiltRef = useRef(null);

  const crystals = useMemo(() => isFrozen ? [
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
  ] : [], [isFrozen]);

  const grapes = useMemo(() => isActive ? Array.from({length:16},(_,i)=>({
    id:i, x:5+(i%5)*19+(i%3)*3, y:8+Math.floor(i/5)*26+(i%2)*5,
    size:5+(i%4)*2.5, delay:i*0.09, opacity:0.35+(i%4)*0.12,
  })) : [], [isActive]);

  const cardBg = isClosed
    ? "linear-gradient(135deg,#1a1a2e,#16213e)"
    : isFrozen
    ? "linear-gradient(160deg,#071428 0%,#0f2748 25%,#1a3d70 55%,#0c1e42 100%)"
    : "linear-gradient(145deg,#130824 0%,#270f5c 30%,#3d1885 60%,#1a0a40 100%)";

  const cardGlow = isClosed ? "none"
    : isFrozen ? "0 20px 60px rgba(20,80,180,0.55), 0 0 0 1px rgba(147,197,253,0.12)"
    : "0 20px 60px rgba(80,20,200,0.6),  0 0 0 1px rgba(167,139,250,0.14)";

  const onMouseMove = (e) => {
    if (!tiltRef.current) return;
    const r = tiltRef.current.getBoundingClientRect();
    const x = (e.clientX-r.left)/r.width  - 0.5;
    const y = (e.clientY-r.top) /r.height - 0.5;
    tiltRef.current.style.transform = `perspective(900px) rotateY(${x*16}deg) rotateX(${-y*16}deg) scale(1.04)`;
  };
  const onMouseLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "perspective(900px) rotateY(0) rotateX(0) scale(1)";
  };

  return (
    <div style={{ width:"100%", maxWidth:"440px", margin:"0 auto" }}>
      <div ref={tiltRef} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        style={{ transition:"transform 0.18s ease", animation:"cardFloat 4.5s ease-in-out infinite", willChange:"transform" }}>

        <div style={{ borderRadius:"24px", padding:"26px 28px", position:"relative", overflow:"hidden",
          background:cardBg, boxShadow:cardGlow, opacity:isClosed?0.5:1,
          transition:"background 1s ease, box-shadow 1s ease" }}>

          {/* ─ FROZEN ─ */}
          {isFrozen && (<>
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
              background:"radial-gradient(ellipse at 15% 20%,rgba(147,197,253,0.10) 0%,transparent 45%),radial-gradient(ellipse at 85% 75%,rgba(186,230,253,0.08) 0%,transparent 40%)" }}/>
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
              background:"linear-gradient(180deg,rgba(186,230,253,0.06) 0%,transparent 45%,rgba(147,197,253,0.05) 100%)",
              animation:"icePulse 3.5s ease-in-out infinite" }}/>
            {crystals.map((cr,i) => <IceCrystal key={i} {...cr}/>)}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:3, pointerEvents:"none" }}>
              <div style={{ textAlign:"center", background:"rgba(7,20,40,0.72)", borderRadius:"18px", padding:"11px 26px", backdropFilter:"blur(8px)", border:"1px solid rgba(147,197,253,0.24)", boxShadow:"0 4px 24px rgba(30,80,180,0.35)" }}>
                <Snowflake size={22} color="#93c5fd" style={{ margin:"0 auto 5px", animation:"spinSlow 8s linear infinite", filter:"drop-shadow(0 0 7px rgba(147,197,253,0.6))" }}/>
                <p style={{ fontSize:"10px", fontWeight:800, color:"#93c5fd", letterSpacing:"0.24em" }}>MUZLATILGAN</p>
              </div>
            </div>
          </>)}

          {/* ─ ACTIVE — uzum ─ */}
          {isActive && (
            <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0,
                background:"radial-gradient(ellipse at 75% 15%,rgba(167,139,250,0.18) 0%,transparent 55%),radial-gradient(ellipse at 15% 85%,rgba(124,58,237,0.14) 0%,transparent 50%)" }}/>
              {grapes.map(g => (
                <div key={g.id} style={{ position:"absolute", left:`${g.x}%`, top:`${g.y}%`,
                  width:`${g.size}px`, height:`${g.size}px`, borderRadius:"50%",
                  background:"radial-gradient(circle at 32% 32%,rgba(216,180,254,0.72),rgba(109,40,217,0.45))",
                  boxShadow:`0 0 ${g.size*1.2}px rgba(139,92,246,0.28), inset 0 1px 0 rgba(255,255,255,0.18)`,
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

          {/* ─ Kontent ─ */}
          <div style={{ position:"relative", zIndex:4 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"28px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"34px", height:"34px", borderRadius:"9px",
                  background:isFrozen?"rgba(147,197,253,0.15)":"rgba(167,139,250,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:isFrozen?"0 0 12px rgba(147,197,253,0.22)":"0 0 12px rgba(139,92,246,0.22)" }}>
                  <CreditCard size={15} color="white"/>
                </div>
                <span style={{ fontSize:"14px", fontWeight:700,
                  color:isFrozen?"rgba(186,230,253,0.9)":"rgba(221,214,254,0.9)" }}>Cho'ntak</span>
              </div>
              <Wifi size={18} color={isFrozen?"rgba(147,197,253,0.52)":"rgba(167,139,250,0.52)"} style={{ transform:"rotate(90deg)" }}/>
            </div>

            <p style={{ fontSize:"21px", fontWeight:900, color:"white", fontFamily:"'Courier New',Courier,monospace",
              letterSpacing:"0.22em", marginBottom:"28px",
              textShadow:isFrozen?"0 0 28px rgba(147,197,253,0.55),0 2px 6px rgba(0,0,0,0.4)":"0 0 28px rgba(139,92,246,0.55),0 2px 6px rgba(0,0,0,0.4)" }}>
              {visible ? (num.length===16?num.match(/.{1,4}/g)?.join("   "):num||"•••• •••• •••• ••••") : `•••• •••• •••• ${num.slice(-4)||"••••"}`}
            </p>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
              <div>
                <p style={{ fontSize:"10px", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.1em",
                  color:isFrozen?"rgba(147,197,253,0.52)":"rgba(167,139,250,0.58)" }}>Balans</p>
                <p style={{ fontSize:"20px", fontWeight:900, color:visible?"white":"rgba(255,255,255,0.22)", transition:"color 0.3s" }}>
                  {visible?`${fmt(card.balance)} so'm`:"••••••••"}
                </p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:"10px", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.1em",
                  color:isFrozen?"rgba(147,197,253,0.52)":"rgba(167,139,250,0.58)" }}>Muddati</p>
                <p style={{ fontSize:"14px", fontWeight:700, fontFamily:"monospace", transition:"color 0.3s",
                  color:visible?(isFrozen?"rgba(186,230,253,0.88)":"rgba(221,214,254,0.88)"):"rgba(255,255,255,0.18)" }}>
                  {visible?exp:"••/••"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isClosed && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"14px", padding:"0 2px" }}>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={(e)=>{e.stopPropagation();onToggleVisible();}}
              style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"10px",
                background:visible?"rgba(99,102,241,0.12)":"rgba(255,255,255,0.05)",
                border:`1px solid ${visible?"rgba(99,102,241,0.28)":"rgba(255,255,255,0.1)"}`,
                cursor:"pointer", color:visible?"#a5b4fc":"rgba(255,255,255,0.45)", fontSize:"12px", fontWeight:600, transition:"all 0.2s" }}>
              {visible?<EyeOff size={13}/>:<Eye size={13}/>}
              {visible?"Yashirish":"Ko'rish"}
            </button>
            <button onClick={(e)=>{e.stopPropagation();onAction(card);}} disabled={actionLoading===card.id}
              style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"10px",
                background:isActive?"rgba(96,165,250,0.1)":"rgba(74,222,128,0.1)",
                border:`1px solid ${isActive?"rgba(96,165,250,0.25)":"rgba(74,222,128,0.25)"}`,
                cursor:actionLoading===card.id?"not-allowed":"pointer",
                color:isActive?"#60a5fa":"#4ade80", fontSize:"12px", fontWeight:600,
                opacity:actionLoading===card.id?0.5:1, transition:"all 0.2s" }}>
              {actionLoading===card.id?<Loader size={13} style={{ animation:"spin 0.8s linear infinite" }}/>:isActive?<Snowflake size={13}/>:<Play size={13}/>}
              {actionLoading===card.id?"...":isActive?"Muzlatish":"Faollashtirish"}
            </button>
          </div>
          <button onClick={(e)=>{e.stopPropagation();onEdit(card.id);}}
            style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"10px",
              background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
              cursor:"pointer", color:"rgba(255,255,255,0.45)", fontSize:"12px", fontWeight:600, transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(99,102,241,0.12)";e.currentTarget.style.color="#a5b4fc";e.currentTarget.style.borderColor="rgba(99,102,241,0.28)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color="rgba(255,255,255,0.45)";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";}}>
            <Edit3 size={13}/> Boshqarish
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function CardsPage() {
  const [cards,setCards]                   = useState([]);
  const [loading,setLoading]               = useState(true);
  const [actionLoading,setActionLoading]   = useState(null);
  const [creating,setCreating]             = useState(false);
  const [error,setError]                   = useState("");
  const [activeIdx,setActiveIdx]           = useState(0);
  const [visible,setVisible]               = useState(false);
  const [newCard,setNewCard]               = useState(null);
  const navigate = useNavigate();

  useEffect(()=>{ fetchCards(); },[]);

  const fetchCards = async () => {
    setLoading(true);
    try { const res = await cardAPI.getAll(); setCards(res.data||[]); }
    catch(e){ console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setCreating(true); setError("");
    try {
      const createRes = await cardAPI.create();
      const res = await cardAPI.getAll();
      const all = res.data||[];
      setCards(all);
      const createdId  = createRes?.data?.id;
      const createdNum = createRes?.data?.card_number;
      const created = all.find(c=>c.id===createdId) || all.find(c=>c.card_number===createdNum) || all[all.length-1];
      if (created) setNewCard({...created, balance:created.balance??0});
    } catch(e){ setError(e.response?.data?.detail||"Xatolik"); }
    finally { setCreating(false); }
  };

  const handleRevealClose = () => { setNewCard(null); setActiveIdx(cards.length-1); };

  const handleAction = async (card) => {
    setActionLoading(card.id); setError("");
    try {
      if (card.status?.toUpperCase()==="ACTIVE")  await cardAPI.freeze(card.id);
      else if (card.status?.toUpperCase()==="FROZEN") await cardAPI.unfreeze(card.id);
      await fetchCards();
    } catch(e){ setError(e.response?.data?.detail||e.message||"Xatolik"); }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", padding:"80px" }}>
      <div style={{ width:"32px", height:"32px", border:"3px solid rgba(99,102,241,0.3)", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const statusColors = {ACTIVE:"#a78bfa",FROZEN:"#93c5fd",CLOSED:"#f87171",active:"#a78bfa",frozen:"#93c5fd",closed:"#f87171"};
  const statusLabels = {ACTIVE:"Faol",FROZEN:"Muzlatilgan",CLOSED:"Yopilgan",active:"Faol",frozen:"Muzlatilgan",closed:"Yopilgan"};

  return (
    <div style={{ maxWidth:"860px" }}>
      {newCard && <CardRevealModal card={newCard} onClose={handleRevealClose}/>}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"28px" }}>
        <div>
          <h1 style={{ fontSize:"26px", fontWeight:800, color:"white", marginBottom:"4px" }}>Kartalarim</h1>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"14px" }}>{cards.length} ta karta</p>
        </div>
        <button onClick={handleCreate} disabled={creating}
          style={{ display:"flex", alignItems:"center", gap:"8px", padding:"11px 20px", background:"linear-gradient(90deg,#6366f1,#8b5cf6)", border:"none", borderRadius:"12px", cursor:creating?"not-allowed":"pointer", color:"white", fontSize:"14px", fontWeight:700, opacity:creating?0.7:1, boxShadow:"0 4px 16px rgba(99,102,241,0.35)", transition:"all 0.2s" }}
          onMouseEnter={e=>{if(!creating){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(99,102,241,0.5)";}}}
          onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 16px rgba(99,102,241,0.35)";}}>
          {creating?<Loader size={15} style={{ animation:"spin 0.8s linear infinite" }}/>:<Plus size={15}/>}
          Yangi karta
        </button>
      </div>

      {error && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"12px", padding:"12px 16px", marginBottom:"16px", fontSize:"13px", color:"#f87171" }}>{error}</div>}

      {cards.length===0 ? (
        <div style={{ background:"#0D0D22", border:"2px dashed rgba(255,255,255,0.08)", borderRadius:"20px", padding:"60px", textAlign:"center" }}>
          <CreditCard size={40} color="rgba(255,255,255,0.12)" style={{ margin:"0 auto 12px" }}/>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"15px", fontWeight:600 }}>Sizda karta mavjud emas</p>
          <p style={{ color:"rgba(255,255,255,0.18)", fontSize:"13px", marginTop:"4px" }}>Yuqoridagi tugmani bosib karta yarating</p>
        </div>
      ) : (<>
        <PhysicalCard card={cards[activeIdx]} visible={visible} onToggleVisible={()=>setVisible(!visible)}
          onAction={handleAction} actionLoading={actionLoading} onEdit={(id)=>navigate(`/cards/${id}`)}/>

        {cards.length>1 && (
          <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginTop:"20px" }}>
            {cards.map((_,i)=>(
              <button key={i} onClick={()=>setActiveIdx(i)}
                style={{ width:i===activeIdx?"26px":"8px", height:"8px", borderRadius:"999px",
                  background:i===activeIdx?"#6366f1":"rgba(255,255,255,0.18)", border:"none", cursor:"pointer", padding:0, transition:"all 0.3s" }}/>
            ))}
          </div>
        )}

        <div style={{ marginTop:"24px", display:"flex", flexDirection:"column", gap:"8px" }}>
          {cards.map((card,i)=>(
            <button key={card.id} onClick={()=>setActiveIdx(i)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px",
                background:i===activeIdx?"rgba(99,102,241,0.1)":"#0D0D22",
                border:`1px solid ${i===activeIdx?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.07)"}`,
                borderRadius:"14px", cursor:"pointer", textAlign:"left", width:"100%", transition:"all 0.2s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"10px",
                  background:i===activeIdx?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.05)",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <CreditCard size={15} color={i===activeIdx?"#818cf8":"rgba(255,255,255,0.3)"}/>
                </div>
                <div>
                  <p style={{ fontSize:"13px", fontWeight:700, color:"white", fontFamily:"monospace", letterSpacing:"0.07em" }}>
                    •••• {getCardNumber(card).slice(-4)||"••••"}
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px", marginTop:"2px" }}>
                    <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:statusColors[card.status]||"#a78bfa" }}/>
                    <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>{statusLabels[card.status]||"—"}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize:"13px", fontWeight:700, color:i===activeIdx?"white":"rgba(255,255,255,0.35)" }}>
                {visible?`${fmt(card.balance)} so'm`:"••••••"}
              </p>
            </button>
          ))}
        </div>
      </>)}

      <style>{`
        @keyframes spin      { from{transform:rotate(0)}  to{transform:rotate(360deg)} }
        @keyframes spinSlow  { from{transform:rotate(0)}  to{transform:rotate(360deg)} }
        @keyframes cardFloat { 0%,100%{transform:translateY(0) rotateZ(-0.6deg)} 50%{transform:translateY(-9px) rotateZ(0.6deg)} }
        @keyframes crFloat   { 0%{transform:rotate(0deg) translateY(0) scale(1);filter:drop-shadow(0 0 4px rgba(147,197,253,0.6))} 100%{transform:rotate(18deg) translateY(-7px) scale(1.12);filter:drop-shadow(0 0 10px rgba(186,230,253,0.95))} }
        @keyframes icePulse  { 0%,100%{opacity:0.55} 50%{opacity:1} }
        @keyframes grapeFloat{ 0%{transform:translateY(0) scale(1)} 100%{transform:translateY(-6px) scale(1.1)} }
        @keyframes cardSheen { 0%{left:-60%} 60%,100%{left:120%} }
      `}</style>
    </div>
  );
}
