import { useState, useEffect } from "react";
import {
  BarChart3, Users, CreditCard, ArrowLeftRight, Send, Scale,
  RefreshCw, Search, ChevronLeft, ChevronRight, DollarSign,
  TrendingUp, TrendingDown, CheckCircle, XCircle, Crown,
  UserX, Wallet, AlertTriangle, ShieldCheck, Eye
} from "lucide-react";
import { adminAPI, cardAPI } from "../api";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("uz-UZ", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

const toBackendStatus = s => s.toLowerCase(); // FIX 1

const TABS = [
  { key:"dashboard", icon:BarChart3,     label:"Dashboard" },
  { key:"users",     icon:Users,          label:"Foydalanuvchilar" },
  { key:"cards",     icon:CreditCard,     label:"Kartalar" },
  { key:"txs",       icon:ArrowLeftRight, label:"Tranzaksiyalar" },
  { key:"deposit",   icon:Send,           label:"Depozit" },
  { key:"verify",    icon:Scale,          label:"Balans tekshiruv" },
];

const SC = { ACTIVE:"#4ade80", active:"#4ade80", FROZEN:"#60a5fa", frozen:"#60a5fa", CLOSED:"#f87171", closed:"#f87171" };
const SL = { ACTIVE:"Faol", active:"Faol", FROZEN:"Muzlatilgan", frozen:"Muzlatilgan", CLOSED:"Yopilgan", closed:"Yopilgan" };
const RC = { USER:"rgba(255,255,255,0.4)", PREMIUM:"#fbbf24", ADMIN:"#f87171" };
const TL = { TRANSFER:"Transfer", transfer:"Transfer", DEPOSIT:"Depozit", deposit:"Depozit", WITHDRAWAL:"Yechib olish", withdrawal:"Yechib olish", null:"Transfer", undefined:"Transfer" };
const getTxType = (tx) => TL[tx.type] || tx.type || (tx.from_card_id ? "Transfer" : "Depozit");
const isPremium = (role) => role?.toUpperCase() === "PREMIUM";

const iS = { width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"12px", padding:"12px 15px", fontSize:"14px", color:"white", outline:"none", boxSizing:"border-box" };

function Spin() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"60px" }}>
      <div style={{ width:"32px", height:"32px", border:"3px solid rgba(99,102,241,0.3)", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );
}

function Pager({ page, pages, setPage }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", marginTop:"24px" }}>
      <button onClick={()=>setPage(p=>p-1)} disabled={page===1} style={{ width:"38px", height:"38px", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", cursor:page===1?"default":"pointer", color:"rgba(255,255,255,0.5)", opacity:page===1?0.4:1 }}><ChevronLeft size={16}/></button>
      <span style={{ fontSize:"14px", color:"rgba(255,255,255,0.4)" }}>{page} / {pages}</span>
      <button onClick={()=>setPage(p=>p+1)} disabled={page===pages} style={{ width:"38px", height:"38px", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", cursor:page===pages?"default":"pointer", color:"rgba(255,255,255,0.5)", opacity:page===pages?0.4:1 }}><ChevronRight size={16}/></button>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 13px", background:"rgba(255,255,255,0.03)", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.06)", gap:"10px" }}>
      <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:"13px", fontWeight:700, color:"white", fontFamily:mono?"monospace":"inherit", textAlign:"right", wordBreak:"break-all" }}>{value||"—"}</span>
    </div>
  );
}

export default function AdminControl() {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text:"", type:"" });

  const [dash, setDash] = useState(null);
  const [calendar, setCalendar] = useState(new Date().toISOString().split("T")[0]);

  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [selUser, setSelUser] = useState(null);

  const [cards, setCards] = useState([]);
  const [cardTotal, setCardTotal] = useState(0);
  const [selCard, setSelCard] = useState(null);
  const [cardPage, setCardPage] = useState(1);
  const [cardPages, setCardPages] = useState(1);
  const [cardSearch, setCardSearch] = useState("");

  const [txs, setTxs] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [selTx, setSelTx] = useState(null);
  const [txPage, setTxPage] = useState(1);
  const [txPages, setTxPages] = useState(1);
  const [txF, setTxF] = useState({ card_number:"", start_date:"", end_date:"" });
  const [txCardSuggestions, setTxCardSuggestions] = useState([]); // FIX 2: live search

  const [platCard, setPlatCard] = useState(null);
  const [allCardsForDep, setAllCardsForDep] = useState([]); // FIX 5
  const [depFrom, setDepFrom] = useState("");
  const [depTo, setDepTo] = useState("");
  const [depAmount, setDepAmount] = useState("");
  const [depDesc, setDepDesc] = useState("");
  const [depLoading, setDepLoading] = useState(false);

  const [verData, setVerData] = useState(null);
  const [verSearch, setVerSearch] = useState("");
  const [verPage, setVerPage] = useState(1);
  const [verSelCard, setVerSelCard] = useState(null); // FIX 6

  const showMsg = (text, type="ok") => { setMsg({ text, type }); setTimeout(()=>setMsg({ text:"", type:"" }), 3500); };
  const errMsg = (e) => {
    const d = e.response?.data;
    if (!d) return showMsg("Server bilan ulanishda xatolik","err");
    if (typeof d==="string") return showMsg(d,"err");
    if (d.detail) return showMsg(typeof d.detail==="string" ? d.detail : JSON.stringify(d.detail),"err");
    showMsg("Xatolik","err");
  };
  const load = async (fn) => { setLoading(true); try { await fn(); } catch(e){ console.error(e); } finally { setLoading(false); } };

  useEffect(() => {
    if (tab==="dashboard") fetchDash();
    else if (tab==="users") fetchUsers();
    else if (tab==="cards") fetchCards();
    else if (tab==="txs") fetchTxs();
    else if (tab==="deposit") { fetchPlatCard(); fetchAllCardsForDep(); }
    else if (tab==="verify") fetchVerify();
  }, [tab, userPage, cardPage, txPage, verPage, calendar]);

  // Verify search handler
  const handleVerSearch = () => { setVerPage(1); fetchVerify(); };

  // FIX 2: tx live card number search
  const handleTxCardInput = async (val) => {
    const clean = val.replace(/\D/g,"").slice(0,16);
    setTxF(f=>({...f, card_number:clean}));
    if (clean.length >= 4) {
      try {
        const r = await adminAPI.getAllCards({ search_card_number: clean, page:1, limit:6 });
        setTxCardSuggestions(r.data.data||[]);
      } catch(_) { setTxCardSuggestions([]); }
    } else {
      setTxCardSuggestions([]);
    }
    if (clean.length === 16) { setTxPage(1); fetchTxsWithNum(clean); }
  };
  const fetchTxsWithNum = (num) => load(async()=>{
    const p={ page:1, limit:10, card_number:num };
    if(txF.start_date) p.start_date=txF.start_date;
    if(txF.end_date) p.end_date=txF.end_date;
    const r=await adminAPI.getAllTransactions(p);
    setTxs(r.data.data||[]); setTxTotal(r.data.total||0); setTxPages(r.data.total_pages||1);
  });

  const fetchDash = () => load(async()=>{ const r=await adminAPI.getDashboard(calendar); setDash(r.data); });
  const fetchUsers = () => load(async()=>{
    const p={ page:userPage, limit:10 };
    if(userSearch.length>=3) p.search_name=userSearch;
    const r=await adminAPI.getAllUsers(p);
    setUsers(r.data.data||[]); setUserTotal(r.data.total_users||0); setUserPages(r.data.total_pages||1);
  });
  const fetchUserDetail = async(id)=>{ try{ const r=await adminAPI.getOneUser(id); setSelUser(r.data); }catch(e){ console.error(e); } };
  const fetchCards = () => load(async()=>{
    const p={ page:cardPage, limit:10 };
    if(cardSearch.length>=2) p.search_card_number=cardSearch;
    const r=await adminAPI.getAllCards(p);
    setCards(r.data.data||[]); setCardTotal(r.data.total_cards||0); setCardPages(r.data.total_pages||1);
  });
  const fetchOneCard = async(id)=>{
    try{
      const r=await adminAPI.getOneCard(id);
      const fromList = cards.find(x=>x.id===id);
      const merged = { ...r.data };
      if (!merged.user && fromList?.user) merged.user = fromList.user;
      if (!merged.owner_name && fromList?.owner_name) merged.owner_name = fromList.owner_name;
      if (!merged.created_at && fromList?.created_at) merged.created_at = fromList.created_at;
      // user yo'q bo'lsa getAllUsers dan izlash
      if (!merged.user?.full_name && !merged.owner_name) {
        try {
          const uRes = await adminAPI.getAllUsers({ page:1, limit:50 });
          const allU = uRes.data.data || [];
          for (const u of allU) {
            const uc = (u.cards||[]).find(cx=>cx.id===id || cx.card_number===merged.card_number);
            if (uc) { merged.user = { full_name: u.full_name, phone_number: u.phone_number }; break; }
          }
        } catch(_){}
      }
      setSelCard(merged);
    }catch(e){ console.error(e); }
  };
  const fetchTxs = () => load(async()=>{
    const p={ page:txPage, limit:10 };
    if(txF.card_number.length===16) p.card_number=txF.card_number;
    if(txF.start_date) p.start_date=txF.start_date;
    if(txF.end_date) p.end_date=txF.end_date;
    const r=await adminAPI.getAllTransactions(p);
    setTxs(r.data.data||[]); setTxTotal(r.data.total||0); setTxPages(r.data.total_pages||1);
  });
  const fetchOneTx = async(id)=>{ try{ const r=await adminAPI.getOneTransaction(id); setSelTx(r.data); }catch(e){ console.error(e); } };
  const fetchPlatCard = () => load(async()=>{ const r=await adminAPI.getPlatformCard(); setPlatCard(r.data); });
  const fetchAllCardsForDep = async()=>{
    try{ const r=await cardAPI.getAll(); setAllCardsForDep(r.data||[]); }catch(e){ console.error(e); }
  };
  const [verCardSuggestions, setVerCardSuggestions] = useState([]);
  const [verCardInfo, setVerCardInfo] = useState(null);
  const [verCardTxs, setVerCardTxs] = useState([]);

  const handleVerSearchInput = async (val) => {
    const clean = val.replace(/\D/g,"").slice(0,16);
    setVerSearch(clean);
    if (clean.length >= 4) {
      try {
        const r = await adminAPI.getAllCards({ search_card_number: clean, page:1, limit:6 });
        setVerCardSuggestions(r.data.data||[]);
      } catch(_) { setVerCardSuggestions([]); }
    } else {
      setVerCardSuggestions([]);
    }
  };
  const selectVerCard = async (card) => {
    setVerSearch(card.card_number);
    setVerCardSuggestions([]);
    setVerCardInfo(card);
    try {
      const txRes = await adminAPI.getAllTransactions({ card_number: card.card_number, page:1, limit:20 });
      setVerCardTxs(txRes.data.data||[]);
      await fetchVerifyOne(card.id);
    } catch(_) {}
  };
  const fetchVerify = () => load(async()=>{
    const p={ page:verPage, limit:20 };
    const r=await adminAPI.verifyAllBalances(p); setVerData(r.data);
    // Agar izlash bo'lsa — karta + tranzaksiyalarni ham olamiz
    if(verSearch.trim().length>=4){
      try{
        const cRes = await adminAPI.getAllCards({ search_card_number: verSearch.trim(), page:1, limit:5 });
        const found = (cRes.data.data||[])[0];
        if(found){
          setVerCardInfo(found);
          const txRes = await adminAPI.getAllTransactions({ card_number: found.card_number, page:1, limit:20 });
          setVerCardTxs(txRes.data.data||[]);
        } else { setVerCardInfo(null); setVerCardTxs([]); }
      }catch(_){ setVerCardInfo(null); setVerCardTxs([]); }
    } else { setVerCardInfo(null); setVerCardTxs([]); }
  });
  const fetchVerifyOne = async(cardId)=>{ try{ const r=await adminAPI.verifyOneBalance(cardId); setVerSelCard(r.data); }catch(e){ errMsg(e); } };

  // FIX 1: lowercase
  const handleCardStatus = async(cid, status)=>{
    try{ await adminAPI.updateCardStatus(cid, toBackendStatus(status)); fetchCards(); if(selCard?.id===cid) fetchOneCard(cid); showMsg("Status yangilandi!"); }
    catch(e){ errMsg(e); }
  };
  const handleRole = async(uid, action)=>{
    try{ await adminAPI.updateUserRole(uid, action); fetchUsers(); if(selUser?.id===uid) fetchUserDetail(uid); showMsg("Rol yangilandi!"); }
    catch(e){ errMsg(e); }
  };
  const handleDeposit = async()=>{
    if(!depFrom||!depTo||!depAmount){ showMsg("Barcha maydonlarni to'ldiring","err"); return; }
    setDepLoading(true);
    try{
      await adminAPI.deposit({ from_card_id:depFrom, to_card_number:depTo, amount:Number(depAmount), description:depDesc||"Admin depozit" });
      setDepFrom(""); setDepTo(""); setDepAmount(""); setDepDesc("");
      showMsg("Depozit muvaffaqiyatli! ✅"); fetchPlatCard(); fetchAllCardsForDep();
    }catch(e){ errMsg(e); }
    finally{ setDepLoading(false); }
  };

  const selS = { ...iS, appearance:"none", cursor:"pointer" };

  return (
    <div style={{ width:"100%" }}>

      {/* FIX 1: Markaziy header */}
      <div style={{ textAlign:"center", marginBottom:"36px" }}>
        <div style={{ width:"64px", height:"64px", borderRadius:"20px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
          <ShieldCheck size={30} color="#f87171"/>
        </div>
        <h1 style={{ fontSize:"30px", fontWeight:900, color:"white", margin:"0 0 6px" }}>Boshqaruv</h1>
        <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.35)", margin:0 }}>Admin panel</p>
      </div>

      {/* FIX 1: Stories uslubida tablar */}
      <div style={{ display:"flex", gap:"14px", justifyContent:"center", marginBottom:"32px", overflowX:"auto", padding:"4px 10%", width:"100%", boxSizing:"border-box" }}>
        {TABS.map(({ key, icon:Icon, label })=>{
          const active = tab===key;
          return (
            <button key={key} onClick={()=>setTab(key)}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px", background:"none", border:"none", cursor:"pointer", padding:"0", flexShrink:0 }}>
              <div style={{
                width:"72px", height:"128px", borderRadius:"18px",
                background: active ? "linear-gradient(160deg,#6366f1,#8b5cf6,#ec4899)" : "#0D0D22",
                border: active ? "none" : "2px solid rgba(255,255,255,0.1)",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"10px",
                boxShadow: active ? "0 8px 24px rgba(99,102,241,0.4)" : "none",
                transition:"all 0.2s",
                transform: active ? "scale(1.06)" : "scale(1)",
              }}>
                <Icon size={22} color={active?"white":"rgba(255,255,255,0.4)"}/>
              </div>
              <span style={{ fontSize:"11px", fontWeight:700, color:active?"white":"rgba(255,255,255,0.4)", textAlign:"center", maxWidth:"72px", lineHeight:"1.3" }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Msg */}
      {msg.text && (
        <div style={{ marginBottom:"18px", background:msg.type==="err"?"rgba(239,68,68,0.1)":"rgba(16,185,129,0.1)", border:`1px solid ${msg.type==="err"?"rgba(239,68,68,0.22)":"rgba(16,185,129,0.22)"}`, borderRadius:"12px", padding:"12px 16px", fontSize:"14px", color:msg.type==="err"?"#f87171":"#4ade80" }}>
          {msg.text}
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {tab==="dashboard" && (
        <div>
          <div style={{ display:"flex", gap:"10px", marginBottom:"24px" }}>
            <input type="date" value={calendar} onChange={e=>setCalendar(e.target.value)} style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", padding:"10px 15px", fontSize:"14px", color:"white", outline:"none" }}/>
            <button onClick={fetchDash} style={{ display:"flex", alignItems:"center", gap:"7px", padding:"10px 16px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"12px", cursor:"pointer", color:"#a5b4fc", fontSize:"14px", fontWeight:600 }}>
              <RefreshCw size={15}/> Yangilash
            </button>
          </div>
          {loading ? <Spin/> : dash && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"16px" }}>
                {[
                  { label:"Umumiy balans",  value:`${fmt(dash.total_balance)} so'm`,        icon:DollarSign, color:"#818cf8", bg:"rgba(129,140,248,0.1)" },
                  { label:"Komissiya",       value:`${fmt(dash.total_commission)} so'm`,      icon:TrendingUp, color:"#fbbf24", bg:"rgba(251,191,36,0.1)" },
                  { label:"Chiquvchi",       value:`${fmt(dash.sender_transactions)} so'm`,   icon:TrendingDown,color:"#f87171",bg:"rgba(248,113,113,0.1)" },
                  { label:"Kiruvchi",        value:`${fmt(dash.receiver_transactions)} so'm`, icon:TrendingUp, color:"#4ade80", bg:"rgba(74,222,128,0.1)" },
                ].map(({ label, value, icon:Icon, color, bg })=>(
                  <div key={label} style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"10px" }}>
                      <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon size={16} color={color}/></div>
                      <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)" }}>{label}</p>
                    </div>
                    <p style={{ fontSize:"17px", fontWeight:900, color:"white" }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <div style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"20px" }}>
                  <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", marginBottom:"14px" }}>Tranzaksiyalar: <strong style={{ color:"white" }}>{dash.total_count} ta</strong></p>
                  <div style={{ display:"flex", gap:"10px" }}>
                    <div style={{ flex:1, background:"rgba(74,222,128,0.07)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:"12px", padding:"12px", textAlign:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"5px", marginBottom:"6px" }}><CheckCircle size={13} color="#4ade80"/><span style={{ fontSize:"12px", color:"#4ade80", fontWeight:600 }}>Muvaffaqiyatli</span></div>
                      <p style={{ fontSize:"22px", fontWeight:900, color:"white" }}>{dash.success_transfers_count}</p>
                      <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)" }}>{dash.success_percent}%</p>
                    </div>
                    <div style={{ flex:1, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:"12px", padding:"12px", textAlign:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"5px", marginBottom:"6px" }}><XCircle size={13} color="#f87171"/><span style={{ fontSize:"12px", color:"#f87171", fontWeight:600 }}>Muvaffaqiyatsiz</span></div>
                      <p style={{ fontSize:"22px", fontWeight:900, color:"white" }}>{dash.failed_transfers_count}</p>
                      <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)" }}>{dash.failed_percent}%</p>
                    </div>
                  </div>
                </div>
                <div style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"20px" }}>
                  <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", marginBottom:"10px" }}>Muvaffaqiyat darajasi</p>
                  <p style={{ fontSize:"44px", fontWeight:900, color:"#4ade80", marginBottom:"14px" }}>{dash.success_percent}%</p>
                  <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:"999px", height:"7px", overflow:"hidden" }}>
                    <div style={{ height:"100%", background:"linear-gradient(90deg,#4ade80,#22c55e)", borderRadius:"999px", width:`${Math.min(100,parseFloat(dash.success_percent)||0)}%`, transition:"width 1s" }}/>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {tab==="users" && (
        <div style={{ display:"grid", gridTemplateColumns:selUser?"1fr 340px":"1fr", gap:"16px" }}>
          <div>
            <div style={{ position:"relative", marginBottom:"16px" }}>
              <Search size={14} color="rgba(255,255,255,0.22)" style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              <input placeholder="Ism bo'yicha (min 3 belgi)..." value={userSearch} onChange={e=>{ setUserSearch(e.target.value); setUserPage(1); if(e.target.value.length===0||e.target.value.length>=3) fetchUsers(); }} style={{ ...iS, paddingLeft:"40px" }}/>
            </div>
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)", marginBottom:"12px" }}>Jami: {userTotal} ta</p>
            {loading ? <Spin/> : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {users.map(u=>(
                  <div key={u.id} onClick={()=>fetchUserDetail(u.id)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:selUser?.id===u.id?"rgba(99,102,241,0.08)":"#0D0D22", border:`1px solid ${selUser?.id===u.id?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:"14px", padding:"14px 18px", cursor:"pointer" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", fontWeight:700, color:"white", flexShrink:0 }}>{u.full_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
                          <p style={{ fontSize:"14px", fontWeight:700, color:"white" }}>{u.full_name}</p>
                          <span style={{ fontSize:"10px", padding:"2px 8px", background:isPremium(u.role)?"rgba(245,158,11,0.12)":"rgba(255,255,255,0.06)", border:`1px solid ${isPremium(u.role)?"rgba(245,158,11,0.22)":"rgba(255,255,255,0.1)"}`, borderRadius:"999px", color:RC[u.role?.toUpperCase()]||"white", fontWeight:700 }}>{u.role}</span>
                        </div>
                        <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.32)" }}>{u.phone_number}</p>
                      </div>
                    </div>
                    <button onClick={e=>{ e.stopPropagation(); handleRole(u.id, isPremium(u.role)?"user":"premium"); }}
                      style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", background:isPremium(u.role)?"rgba(255,255,255,0.06)":"rgba(245,158,11,0.1)", border:`1px solid ${isPremium(u.role)?"rgba(255,255,255,0.1)":"rgba(245,158,11,0.2)"}`, borderRadius:"10px", cursor:"pointer", color:isPremium(u.role)?"rgba(255,255,255,0.5)":"#fbbf24", fontSize:"12px", fontWeight:600 }}>
                      {isPremium(u.role)?<><UserX size={12}/> Bekor</>:<><Crown size={12}/> Premium</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Pager page={userPage} pages={userPages} setPage={setUserPage}/>
          </div>
          {selUser && (
            <div style={{ background:"#0D0D22", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"16px", padding:"20px", alignSelf:"start", position:"sticky", top:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <p style={{ fontSize:"14px", fontWeight:700, color:"white" }}>Batafsil</p>
                <button onClick={()=>setSelUser(null)} style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>×</button>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px", padding:"14px", background:"rgba(255,255,255,0.03)", borderRadius:"12px" }}>
                <div style={{ width:"46px", height:"46px", borderRadius:"13px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", fontWeight:700, color:"white", flexShrink:0 }}>{selUser.full_name?.[0]?.toUpperCase()}</div>
                <div>
                  <p style={{ fontSize:"15px", fontWeight:800, color:"white" }}>{selUser.full_name}</p>
                  <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)" }}>{selUser.phone_number}</p>
                  <span style={{ fontSize:"10px", padding:"2px 8px", background:isPremium(selUser.role)?"rgba(245,158,11,0.12)":"rgba(255,255,255,0.06)", border:`1px solid ${isPremium(selUser.role)?"rgba(245,158,11,0.22)":"rgba(255,255,255,0.1)"}`, borderRadius:"999px", color:RC[selUser.role?.toUpperCase()]||"white", fontWeight:700 }}>{selUser.role}</span>
                </div>
              </div>
              {/* FIX 1: selUser panel ichida rol o'zgartirish tugmasi */}
              <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
                {!isPremium(selUser.role) && (
                  <button onClick={()=>handleRole(selUser.id,"premium")}
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", padding:"10px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"10px", cursor:"pointer", color:"#fbbf24", fontSize:"13px", fontWeight:700 }}>
                    <Crown size={14}/> Premium berish
                  </button>
                )}
                {isPremium(selUser.role) && (
                  <button onClick={()=>handleRole(selUser.id,"user")}
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", padding:"10px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.16)", borderRadius:"10px", cursor:"pointer", color:"#f87171", fontSize:"13px", fontWeight:700 }}>
                    <UserX size={14}/> Premiumni olib tashlash
                  </button>
                )}
              </div>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Kartalar ({selUser.cards?.length||0} ta)</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {(selUser.cards||[]).map(c=>(
                  <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 13px", background:"rgba(255,255,255,0.03)", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:SC[c.status]||"#888" }}/>
                      <span style={{ fontSize:"13px", color:"white", fontFamily:"monospace" }}>•••• {c.card_number?.slice(-4)}</span>
                    </div>
                    <span style={{ fontSize:"12px", fontWeight:700, color:"rgba(255,255,255,0.6)" }}>{fmt(c.balance)} so'm</span>
                  </div>
                ))}
                {!selUser.cards?.length && <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.2)", textAlign:"center", padding:"12px" }}>Karta yo'q</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CARDS ── */}
      {tab==="cards" && (
        <div style={{ display:"grid", gridTemplateColumns:selCard?"1fr 320px":"1fr", gap:"16px" }}>
          <div>
            <div style={{ position:"relative", marginBottom:"16px" }}>
              <Search size={14} color="rgba(255,255,255,0.22)" style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              <input placeholder="Karta raqami bo'yicha..." value={cardSearch} onChange={e=>{ setCardSearch(e.target.value); setCardPage(1); if(e.target.value.length===0||e.target.value.length>=2) fetchCards(); }} style={{ ...iS, paddingLeft:"40px" }}/>
            </div>
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)", marginBottom:"12px" }}>Jami: {cardTotal} ta</p>
            {loading ? <Spin/> : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {cards.map(card=>(
                  <div key={card.id} onClick={()=>fetchOneCard(card.id)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:selCard?.id===card.id?"rgba(99,102,241,0.08)":"#0D0D22", border:`1px solid ${selCard?.id===card.id?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:"14px", padding:"14px 18px", cursor:"pointer" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><CreditCard size={17} color="#818cf8"/></div>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
                          <p style={{ fontSize:"14px", fontWeight:700, color:"white", fontFamily:"monospace" }}>•••• {card.card_number?.slice(-4)}</p>
                          <div style={{ display:"flex", alignItems:"center", gap:"4px", padding:"2px 8px", background:`${SC[card.status]||"#888"}18`, border:`1px solid ${SC[card.status]||"#888"}30`, borderRadius:"999px" }}>
                            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:SC[card.status]||"#888" }}/>
                            <span style={{ fontSize:"10px", color:SC[card.status]||"#888", fontWeight:700 }}>{SL[card.status]||card.status}</span>
                          </div>
                        </div>
                        {/* FIX 2: owner_name */}
                        <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.32)" }}>{card.user?.full_name||card.owner_name||"—"} • {fmt(card.balance)} so'm</p>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"6px" }} onClick={e=>e.stopPropagation()}>
                      {!["active","ACTIVE"].includes(card.status) && <button onClick={()=>handleCardStatus(card.id,"active")} style={{ padding:"7px 12px", background:"rgba(74,222,128,0.09)", border:"1px solid rgba(74,222,128,0.18)", borderRadius:"9px", cursor:"pointer", color:"#4ade80", fontSize:"12px", fontWeight:600 }}>Faollashtirish</button>}
                      {!["frozen","FROZEN","closed","CLOSED"].includes(card.status) && <button onClick={()=>handleCardStatus(card.id,"frozen")} style={{ padding:"7px 12px", background:"rgba(96,165,250,0.09)", border:"1px solid rgba(96,165,250,0.18)", borderRadius:"9px", cursor:"pointer", color:"#60a5fa", fontSize:"12px", fontWeight:600 }}>Muzlatish</button>}
                      {!["closed","CLOSED"].includes(card.status) && <button onClick={()=>handleCardStatus(card.id,"closed")} style={{ padding:"7px 12px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.16)", borderRadius:"9px", cursor:"pointer", color:"#f87171", fontSize:"12px", fontWeight:600 }}>Yopish</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pager page={cardPage} pages={cardPages} setPage={setCardPage}/>
          </div>
          {selCard && (
            <div style={{ background:"#0D0D22", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"16px", padding:"20px", alignSelf:"start", position:"sticky", top:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <p style={{ fontSize:"14px", fontWeight:700, color:"white" }}>Karta batafsil</p>
                <button onClick={()=>setSelCard(null)} style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>×</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                <Row label="Karta raqami" value={selCard.card_number?.match(/.{1,4}/g)?.join(" ")} mono/>
                <Row label="Egasi" value={selCard.user?.full_name||selCard.owner_name||(cards.find(x=>x.id===selCard.id)?.user?.full_name)||(cards.find(x=>x.id===selCard.id)?.owner_name)||"—"}/>
                <Row label="Balans" value={`${fmt(selCard.balance)} so'm`}/>
                <Row label="Status" value={SL[selCard.status]||selCard.status}/>
                <Row label="Muddati" value={selCard.expiry_date?.slice(0,7)}/>
                <Row label="Yaratilgan" value={fmtDate(selCard.created_at)}/>
              </div>
              <div style={{ display:"flex", gap:"6px", marginTop:"14px" }}>
                {!["active","ACTIVE"].includes(selCard.status) && <button onClick={()=>handleCardStatus(selCard.id,"active")} style={{ flex:1, padding:"9px", background:"rgba(74,222,128,0.09)", border:"1px solid rgba(74,222,128,0.18)", borderRadius:"10px", cursor:"pointer", color:"#4ade80", fontSize:"12px", fontWeight:600 }}>Faollashtirish</button>}
                {!["frozen","FROZEN","closed","CLOSED"].includes(selCard.status) && <button onClick={()=>handleCardStatus(selCard.id,"frozen")} style={{ flex:1, padding:"9px", background:"rgba(96,165,250,0.09)", border:"1px solid rgba(96,165,250,0.18)", borderRadius:"10px", cursor:"pointer", color:"#60a5fa", fontSize:"12px", fontWeight:600 }}>Muzlatish</button>}
                {!["closed","CLOSED"].includes(selCard.status) && <button onClick={()=>handleCardStatus(selCard.id,"closed")} style={{ flex:1, padding:"9px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.16)", borderRadius:"10px", cursor:"pointer", color:"#f87171", fontSize:"12px", fontWeight:600 }}>Yopish</button>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {tab==="txs" && (
        <div style={{ display:"grid", gridTemplateColumns:selTx?"1fr 320px":"1fr", gap:"16px" }}>
          <div>
            {/* FIX 2: Live karta qidirish */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:"8px", marginBottom:"16px" }}>
              <div style={{ position:"relative" }}>
                <Search size={14} color="rgba(255,255,255,0.22)" style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                <input
                  placeholder="Karta raqami (4+ raqam)..."
                  value={txF.card_number}
                  onChange={e=>handleTxCardInput(e.target.value)}
                  style={{ ...iS, paddingLeft:"40px" }}
                  autoComplete="off"
                />
                {txCardSuggestions.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#0D0D22", border:"1px solid rgba(99,102,241,0.25)", borderRadius:"12px", zIndex:100, marginTop:"4px", overflow:"hidden" }}>
                    {txCardSuggestions.map(c=>(
                      <div key={c.id} onClick={()=>{ setTxF(f=>({...f,card_number:c.card_number})); setTxCardSuggestions([]); setTxPage(1); fetchTxsWithNum(c.card_number); }}
                        style={{ padding:"10px 14px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.05)" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.08)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{ fontSize:"13px", color:"white", fontFamily:"monospace" }}>{c.card_number?.match(/.{1,4}/g)?.join(" ")}</span>
                        <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)" }}>{c.user?.full_name||c.owner_name||"—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <input type="date" value={txF.start_date} onChange={e=>setTxF(f=>({...f, start_date:e.target.value}))} style={iS}/>
                <input type="date" value={txF.end_date} onChange={e=>setTxF(f=>({...f, end_date:e.target.value}))} style={iS}/>
              </div>
              <button onClick={()=>{ setTxPage(1); fetchTxs(); }} style={{ padding:"12px 16px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"12px", cursor:"pointer", color:"#a5b4fc", fontSize:"14px", fontWeight:600, display:"flex", alignItems:"center", gap:"6px", whiteSpace:"nowrap" }}>
                <Search size={14}/> Qidirish
              </button>
            </div>
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.3)", marginBottom:"12px" }}>Jami: {txTotal} ta</p>
            {loading ? <Spin/> : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {txs.length===0 && <p style={{ textAlign:"center", color:"rgba(255,255,255,0.25)", padding:"40px 0", fontSize:"14px" }}>Tranzaksiya topilmadi</p>}
                {txs.map(tx=>{
                  const filterNum = txF.card_number;
                  const isOut = filterNum ? tx.from_card?.card_number===filterNum : null;
                  const isIn  = filterNum ? tx.to_card?.card_number===filterNum   : null;
                  const hasDir = isOut!==null;
                  const color  = hasDir ? (isOut?"#f87171":"#4ade80") : "rgba(255,255,255,0.7)";
                  const bg     = hasDir ? (isOut?"rgba(239,68,68,0.1)":"rgba(74,222,128,0.1)") : "rgba(255,255,255,0.05)";
                  return (
                    <div key={tx.id} onClick={()=>fetchOneTx(tx.id)}
                      style={{ background:selTx?.id===tx.id?"rgba(99,102,241,0.08)":"#0D0D22", border:`1px solid ${selTx?.id===tx.id?"rgba(99,102,241,0.25)":hasDir?(isOut?"rgba(239,68,68,0.12)":"rgba(74,222,128,0.12)"):"rgba(255,255,255,0.06)"}`, borderRadius:"14px", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.07)"}
                      onMouseLeave={e=>e.currentTarget.style.background=selTx?.id===tx.id?"rgba(99,102,241,0.08)":"#0D0D22"}>
                      <div style={{ display:"flex", alignItems:"center", gap:"12px", flex:1, minWidth:0 }}>
                        <div style={{ width:"46px", height:"46px", borderRadius:"13px", flexShrink:0, background:bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2px" }}>
                          {hasDir
                            ? <><span style={{ fontSize:"16px", lineHeight:1, color }}>{isOut?"↑":"↓"}</span><span style={{ fontSize:"9px", fontWeight:700, color, letterSpacing:"0.02em" }}>{isOut?"CHIQIM":"KIRIM"}</span></>
                            : (["SUCCESS","success"].includes(tx.status)?<CheckCircle size={18} color="#4ade80"/>:<XCircle size={18} color="#f87171"/>)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"5px", flexWrap:"wrap" }}>
                            {hasDir
                              ? <span style={{ fontSize:"14px", fontWeight:800, color }}>{isOut?"-":"+"} {fmt(tx.amount)} so'm</span>
                              : <span style={{ fontSize:"14px", fontWeight:700, color:"white" }}>{fmt(tx.amount)} so'm</span>}
                            <span style={{ fontSize:"11px", padding:"2px 8px", background:"rgba(255,255,255,0.05)", borderRadius:"6px", color:"rgba(255,255,255,0.4)" }}>{getTxType(tx)}</span>
                            {tx.commission>0 && <span style={{ fontSize:"10px", padding:"1px 7px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"999px", color:"#fbbf24" }}>kom: {fmt(tx.commission)}</span>}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                            {tx.from_card && <span style={{ fontSize:"11px", color:"#f87171", fontFamily:"monospace", background:"rgba(239,68,68,0.07)", padding:"2px 7px", borderRadius:"5px" }}>↑ {tx.from_card.card_number?.match(/.{1,4}/g)?.join(" ")}</span>}
                            {tx.from_card && tx.to_card && <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)" }}>→</span>}
                            {tx.to_card && <span style={{ fontSize:"11px", color:"#4ade80", fontFamily:"monospace", background:"rgba(74,222,128,0.07)", padding:"2px 7px", borderRadius:"5px" }}>↓ {tx.to_card.card_number?.match(/.{1,4}/g)?.join(" ")}</span>}
                            {tx.description && <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"150px" }}>{tx.description}</span>}
                            <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.22)" }}>{fmtDate(tx.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      {["SUCCESS","success"].includes(tx.status)
                        ? <CheckCircle size={14} color="#4ade80" style={{ flexShrink:0 }}/>
                        : <XCircle size={14} color="#f87171" style={{ flexShrink:0 }}/>}
                    </div>
                  );
                })}
              </div>
            )}
            <Pager page={txPage} pages={txPages} setPage={setTxPage}/>
          </div>

          {/* FIX 4: to'liq detail */}
          {selTx && (
            <div style={{ background:"#0D0D22", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"16px", padding:"20px", alignSelf:"start", position:"sticky", top:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <p style={{ fontSize:"14px", fontWeight:700, color:"white" }}>Tranzaksiya batafsil</p>
                <button onClick={()=>setSelTx(null)} style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>×</button>
              </div>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 20px", background:["SUCCESS","success"].includes(selTx.status)?"rgba(74,222,128,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${["SUCCESS","success"].includes(selTx.status)?"rgba(74,222,128,0.25)":"rgba(239,68,68,0.25)"}`, borderRadius:"12px" }}>
                  {["SUCCESS","success"].includes(selTx.status)?<CheckCircle size={16} color="#4ade80"/>:<XCircle size={16} color="#f87171"/>}
                  <span style={{ fontSize:"14px", fontWeight:700, color:["SUCCESS","success"].includes(selTx.status)?"#4ade80":"#f87171" }}>
                    {["SUCCESS","success"].includes(selTx.status)?"Muvaffaqiyatli":"Muvaffaqiyatsiz"}
                  </span>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                <Row label="Miqdor" value={`${fmt(selTx.amount)} so'm`}/>
                <Row label="Komissiya" value={`${fmt(selTx.commission)} so'm`}/>
                <Row label="Tur" value={getTxType(selTx)}/>
                <Row label="Izoh" value={selTx.description}/>
                <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", margin:"4px 0" }}/>
                <p style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Kimdan</p>
                {selTx.from_card
                  ? <><Row label="Karta" value={selTx.from_card.card_number?.match(/.{1,4}/g)?.join(" ")} mono/><Row label="Egasi" value={selTx.from_card.owner_name||"—"}/></>
                  : <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.25)", paddingLeft:"4px" }}>— tashqi manba</p>}
                <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", margin:"4px 0" }}/>
                <p style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Kimga</p>
                {selTx.to_card
                  ? <><Row label="Karta" value={selTx.to_card.card_number?.match(/.{1,4}/g)?.join(" ")} mono/><Row label="Egasi" value={selTx.to_card.owner_name||"—"}/></>
                  : <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.25)", paddingLeft:"4px" }}>— tashqi qabul</p>}
                <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", margin:"4px 0" }}/>
                <Row label="Yaratilgan" value={fmtDate(selTx.created_at)}/>
                <Row label="Yakunlangan" value={fmtDate(selTx.completed_at)}/>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DEPOSIT ── */}
      {tab==="deposit" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
          <div style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"18px" }}><Wallet size={17} color="#818cf8"/><p style={{ fontSize:"15px", fontWeight:700, color:"white" }}>Platform kartasi</p></div>
            {loading ? <Spin/> : platCard ? (
              <div style={{ borderRadius:"16px", padding:"20px", background:"linear-gradient(135deg,#1e1b4b,#3730a3,#4f46e5)", boxShadow:"0 10px 30px rgba(99,102,241,0.3)" }}>
                <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", marginBottom:"8px", letterSpacing:"0.12em" }}>PLATFORM KARTA</p>
                <p style={{ fontSize:"16px", fontWeight:900, color:"white", fontFamily:"monospace", letterSpacing:"0.15em", marginBottom:"14px" }}>{platCard.card_number?.match(/.{1,4}/g)?.join("  ")}</p>
                <p style={{ fontSize:"20px", fontWeight:900, color:"white" }}>{fmt(platCard.balance)} so'm</p>
              </div>
            ) : <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"14px" }}>Topilmadi</p>}
          </div>

          {/* FIX 5: UUID o'rniga dropdown */}
          <div style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"22px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"18px" }}><Send size={17} color="#4ade80"/><p style={{ fontSize:"15px", fontWeight:700, color:"white" }}>Depozit yuborish</p></div>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div>
                <label style={{ display:"block", fontSize:"11px", fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Manba karta</label>
                <select value={depFrom} onChange={e=>setDepFrom(e.target.value)} style={selS}>
                  <option value="">— Karta tanlang —</option>
                  {allCardsForDep.map(c=>(
                    <option key={c.id} value={c.id}>
                      •••• {c.card_number?.slice(-4)} — {fmt(c.balance)} so'm{c.owner_name||c.user?.full_name ? ` (${c.owner_name||c.user?.full_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display:"block", fontSize:"11px", fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Qabul qiluvchi karta raqami</label>
                <input placeholder="1234567890123456" value={depTo} onChange={e=>setDepTo(e.target.value.replace(/\D/g,"").slice(0,16))} style={iS}/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:"11px", fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Miqdor (so'm)</label>
                <input type="number" placeholder="100000" value={depAmount} onChange={e=>setDepAmount(e.target.value)} style={iS}/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:"11px", fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Izoh (ixtiyoriy)</label>
                <input placeholder="To'lov maqsadi..." value={depDesc} onChange={e=>setDepDesc(e.target.value)} style={iS}/>
              </div>
              <button onClick={handleDeposit} disabled={depLoading}
                style={{ padding:"14px", background:depLoading?"rgba(99,102,241,0.4)":"linear-gradient(90deg,#6366f1,#8b5cf6)", border:"none", borderRadius:"12px", cursor:depLoading?"not-allowed":"pointer", color:"white", fontSize:"14px", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                {depLoading?<><div style={{ width:"15px", height:"15px", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>Yuborilmoqda...</>:<><Send size={15}/>Depozit yuborish</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VERIFY ── */}
      {tab==="verify" && (
        <div style={{ display:"grid", gridTemplateColumns:verSelCard?"1fr 320px":"1fr", gap:"16px" }}>
          <div>
            {verData && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"20px" }}>
                {[
                  { label:"Jami kartalar", value:verData.total_cards, color:"#818cf8" },
                  { label:"To'g'ri balans", value:verData.total_valid_cards, color:"#4ade80" },
                  { label:"Xato balans", value:verData.total_invalid_cards, color:"#f87171" },
                ].map(({ label, value, color })=>(
                  <div key={label} style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"16px", textAlign:"center" }}>
                    <p style={{ fontSize:"28px", fontWeight:900, color, marginBottom:"5px" }}>{value}</p>
                    <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)" }}>{label}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
              <div style={{ position:"relative", flex:1 }}>
                <Search size={14} color="rgba(255,255,255,0.22)" style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                <input
                  placeholder="Karta raqami (4+ raqam yozing)..."
                  value={verSearch}
                  onChange={e=>handleVerSearchInput(e.target.value)}
                  style={{ ...iS, paddingLeft:"40px" }}
                  autoComplete="off"
                />
                {verCardSuggestions.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#0D0D22", border:"1px solid rgba(99,102,241,0.25)", borderRadius:"12px", zIndex:100, marginTop:"4px", overflow:"hidden" }}>
                    {verCardSuggestions.map(c=>(
                      <div key={c.id} onClick={()=>selectVerCard(c)}
                        style={{ padding:"10px 14px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.05)" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.08)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span style={{ fontSize:"13px", color:"white", fontFamily:"monospace" }}>{c.card_number?.match(/.{1,4}/g)?.join(" ")}</span>
                        <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)" }}>{c.user?.full_name||c.owner_name||"—"} • {fmt(c.balance)} so'm</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleVerSearch} style={{ padding:"12px 16px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"12px", cursor:"pointer", color:"#a5b4fc", display:"flex", alignItems:"center", gap:"6px", fontSize:"13px", fontWeight:600 }}><Search size={15}/>Izlash</button>
            </div>

            {/* FIX 6: Jadval ko'rinishi */}
            {loading ? <Spin/> : verData && (
              <div style={{ background:"#0D0D22", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1.4fr 1.4fr 1fr 70px", padding:"12px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}>
                  {["Karta raqami","Saqlangan","Hisoblangan","Farq",""].map(h=>(
                    <span key={h} style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h}</span>
                  ))}
                </div>
                {verData.bug_details?.length > 0 ? verData.bug_details.map((b,i)=>(
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1.4fr 1.4fr 1fr 70px", padding:"13px 18px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:"rgba(239,68,68,0.03)", alignItems:"center" }}>
                    <span style={{ fontSize:"13px", color:"white", fontFamily:"monospace", fontWeight:600 }}>{b.card_number}</span>
                    <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)" }}>{fmt(b.stored_balance)}</span>
                    <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)" }}>{fmt(b.calculated_balance)}</span>
                    <span style={{ fontSize:"13px", fontWeight:700, color:"#f87171" }}>{b.difference>0?"+":""}{fmt(b.difference)}</span>
                    <button onClick={async()=>{
                      const cid = b.card_id||b.id;
                      if(cid && cid!=="undefined"){
                        fetchVerifyOne(cid);
                      } else {
                        // card_number orqali topamiz
                        try{
                          const r = await adminAPI.getAllCards({ search_card_number: b.card_number, page:1, limit:1 });
                          const found = (r.data.data||[])[0];
                          if(found) fetchVerifyOne(found.id);
                        }catch(_){}
                      }
                    }} style={{ padding:"5px 10px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"7px", cursor:"pointer", color:"#a5b4fc", fontSize:"11px", fontWeight:600, display:"flex", alignItems:"center", gap:"4px" }}><Eye size={11}/>Ko'r</button>
                  </div>
                )) : (
                  <div style={{ textAlign:"center", padding:"40px" }}>
                    <CheckCircle size={36} color="#4ade80" style={{ margin:"0 auto 12px" }}/>
                    <p style={{ fontSize:"15px", fontWeight:700, color:"#4ade80" }}>Barcha balanslar to'g'ri!</p>
                  </div>
                )}
              </div>
            )}
            <Pager page={verPage} pages={verData?.total_page||1} setPage={setVerPage}/>

            {/* FIX 3: Izlash natijasi — karta + tranzaksiyalar */}
            {verCardInfo && (
              <div style={{ marginTop:"20px" }}>
                {/* Karta ma'lumoti */}
                <div style={{ background:"#0D0D22", border:"1px solid rgba(99,102,241,0.18)", borderRadius:"14px", padding:"16px 20px", marginBottom:"12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                    <div style={{ width:"42px", height:"42px", borderRadius:"12px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}><CreditCard size={18} color="#818cf8"/></div>
                    <div>
                      <p style={{ fontSize:"15px", fontWeight:800, color:"white", fontFamily:"monospace" }}>{verCardInfo.card_number?.match(/.{1,4}/g)?.join(" ")}</p>
                      <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", marginTop:"2px" }}>{verCardInfo.user?.full_name||verCardInfo.owner_name||"—"} • {fmt(verCardInfo.balance)} so'm</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"5px 12px", background:`${SC[verCardInfo.status]||"#888"}15`, border:`1px solid ${SC[verCardInfo.status]||"#888"}30`, borderRadius:"999px" }}>
                    <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:SC[verCardInfo.status]||"#888" }}/>
                    <span style={{ fontSize:"12px", fontWeight:700, color:SC[verCardInfo.status]||"#888" }}>{SL[verCardInfo.status]||verCardInfo.status}</span>
                  </div>
                </div>

                {/* Tranzaksiyalar */}
                <p style={{ fontSize:"12px", fontWeight:700, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"10px" }}>
                  Tranzaksiyalar ({verCardTxs.length} ta)
                </p>
                {verCardTxs.length===0
                  ? <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.25)", textAlign:"center", padding:"20px 0" }}>Tranzaksiya topilmadi</p>
                  : <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {verCardTxs.map(vtx=>{
                      // Bu kartadan chiqim yoki kirim?
                      const isOut = vtx.from_card?.card_number === verCardInfo?.card_number;
                      const isIn  = vtx.to_card?.card_number   === verCardInfo?.card_number;
                      const color = isOut ? "#f87171" : "#4ade80";
                      const bg    = isOut ? "rgba(239,68,68,0.1)" : "rgba(74,222,128,0.1)";
                      const arrow = isOut ? "↑ Chiqim" : "↓ Kirim";
                      const other = isOut ? vtx.to_card : vtx.from_card;
                      return (
                        <div key={vtx.id} onClick={()=>fetchOneTx(vtx.id)}
                          style={{ background:"#0D0D22", border:`1px solid ${isOut?"rgba(239,68,68,0.12)":"rgba(74,222,128,0.12)"}`, borderRadius:"14px", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", cursor:"pointer" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.07)"}
                          onMouseLeave={e=>e.currentTarget.style.background="#0D0D22"}>
                          <div style={{ display:"flex", alignItems:"center", gap:"12px", flex:1, minWidth:0 }}>
                            {/* Kirim/Chiqim badge */}
                            <div style={{ width:"46px", height:"46px", borderRadius:"13px", flexShrink:0, background:bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2px" }}>
                              <span style={{ fontSize:"16px", lineHeight:1 }}>{isOut?"↑":"↓"}</span>
                              <span style={{ fontSize:"9px", fontWeight:700, color, letterSpacing:"0.02em" }}>{isOut?"CHIQIM":"KIRIM"}</span>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"5px" }}>
                                <span style={{ fontSize:"14px", fontWeight:800, color }}>{isOut?"-":"+"}  {fmt(vtx.amount)} so'm</span>
                                {vtx.commission>0 && <span style={{ fontSize:"10px", padding:"1px 7px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"999px", color:"#fbbf24", flexShrink:0 }}>kom: {fmt(vtx.commission)}</span>}
                              </div>
                              <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                                {other
                                  ? <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.55)", fontFamily:"monospace", background:"rgba(255,255,255,0.05)", padding:"2px 8px", borderRadius:"6px" }}>
                                      {isOut?"→":"←"} {other.card_number?.match(/.{1,4}/g)?.join(" ")}
                                    </span>
                                  : null}
                                {vtx.description && <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"140px" }}>{vtx.description}</span>}
                                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.22)" }}>{fmtDate(vtx.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          {["SUCCESS","success"].includes(vtx.status)
                            ? <CheckCircle size={15} color="#4ade80" style={{ flexShrink:0 }}/>
                            : <XCircle size={15} color="#f87171" style={{ flexShrink:0 }}/>}
                        </div>
                      );
                    })}
                  </div>
                }
              </div>
            )}
          </div>

          {/* FIX 6: Karta verify detail panel */}
          {verSelCard && (
            <div style={{ background:"#0D0D22", border:"1px solid rgba(99,102,241,0.2)", borderRadius:"16px", padding:"20px", alignSelf:"start", position:"sticky", top:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <p style={{ fontSize:"14px", fontWeight:700, color:"white" }}>Balans tekshiruv</p>
                <button onClick={()=>setVerSelCard(null)} style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>×</button>
              </div>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 20px", background:verSelCard.audit?.status==="OK"?"rgba(74,222,128,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${verSelCard.audit?.status==="OK"?"rgba(74,222,128,0.25)":"rgba(239,68,68,0.25)"}`, borderRadius:"12px" }}>
                  {verSelCard.audit?.status==="OK"?<CheckCircle size={16} color="#4ade80"/>:<AlertTriangle size={16} color="#f87171"/>}
                  <span style={{ fontSize:"14px", fontWeight:700, color:verSelCard.audit?.status==="OK"?"#4ade80":"#f87171" }}>
                    {verSelCard.audit?.status==="OK"?"Balans to'g'ri":"Nomuvofiqlik bor"}
                  </span>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                <Row label="Karta raqami" value={verSelCard.card_info?.number||verSelCard.card_info?.card_number} mono/>
                <Row label="Egasi" value={verSelCard.card_info?.owner_name||verSelCard.card_info?.user?.full_name||"—"}/>
                <Row label="Balans" value={verSelCard.card_info?.balance!=null?`${fmt(verSelCard.card_info.balance)} so'm`:"—"}/>
                <Row label="Saqlangan" value={`${fmt(verSelCard.audit?.stored_balance)} so'm`}/>
                <Row label="Hisoblangan" value={`${fmt(verSelCard.audit?.calculated_balance)} so'm`}/>
                <Row label="Farq" value={`${fmt(verSelCard.audit?.difference)} so'm`}/>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        select option { background: #0D0D22; color: white; }
      `}</style>
    </div>
  );
}
