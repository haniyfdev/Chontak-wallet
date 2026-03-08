import { useEffect, useState, useRef } from "react";
import { transactionAPI, cardAPI } from "../api";
import { ArrowUpRight, ArrowDownLeft, Filter, ChevronLeft, ChevronRight, X, CreditCard } from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("uz-UZ", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function fmtDay(d) {
  if (!d) return "";
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Bugun";
  if (date.toDateString() === yesterday.toDateString()) return "Kecha";
  return date.toLocaleDateString("uz-UZ", { day:"2-digit", month:"long", year:"numeric" });
}

function TxDetailModal({ tx, isOut, onClose }) {
  if (!tx) return null;
  const fromNum = tx.from_card?.card_number || "";
  const toNum = tx.to_card?.card_number || "";
  const accent = isOut ? "#f87171" : "#4ade80";
  const hBg = isOut ? "linear-gradient(135deg,#4c0519,#7f1d1d,#991b1b)" : "linear-gradient(135deg,#064e3b,#065f46,#047857)";
  const sep = isOut ? "#991b1b" : "#047857";
  const rows = [
    { label:"Tranzaksiya ID", value: tx.id||"—", mono:true },
    { label:"Sana", value: fmtDate(tx.completed_at||tx.created_at) },
    { label:"Kimdan", value: fromNum||"—", mono:true },
    { label:"Kimga", value: toNum||"—", mono:true },
    tx.description ? { label:"Izoh", value: tx.description } : null,
    { label:"Komissiya", value: Number(tx.commission)>0?`${fmt(tx.commission)} so'm`:"Bepul", valueColor: Number(tx.commission)>0?"#fbbf24":"#4ade80" },
    { label:"Status", value:"Muvaffaqiyatli", valueColor:"#4ade80" },
  ].filter(Boolean);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}} onClick={onClose}>
      <div style={{background:"#0D0D22",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"24px",width:"100%",maxWidth:"440px",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.7)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:hBg,padding:"32px 28px",textAlign:"center",position:"relative"}}>
          <div style={{width:"64px",height:"64px",borderRadius:"50%",background:`${accent}22`,border:`2px solid ${accent}77`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            {isOut?<ArrowUpRight size={28} color={accent}/>:<ArrowDownLeft size={28} color={accent}/>}
          </div>
          <p style={{fontSize:"15px",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:"6px"}}>{isOut?"Chiqim":"Kirim"}</p>
          <p style={{fontSize:"36px",fontWeight:900,color:accent,lineHeight:1}}>{isOut?"−":"+"}{fmt(tx.amount)} so'm</p>
          <button onClick={onClose} style={{position:"absolute",top:"14px",right:"14px",background:"rgba(255,255,255,0.12)",border:"none",borderRadius:"8px",width:"32px",height:"32px",cursor:"pointer",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={16}/></button>
        </div>
        <div style={{background:sep,lineHeight:0}}>
          <svg viewBox="0 0 440 18" preserveAspectRatio="none" style={{width:"100%",height:"18px",display:"block"}}>
            <path d="M0,0 Q11,18 22,0 Q33,18 44,0 Q55,18 66,0 Q77,18 88,0 Q99,18 110,0 Q121,18 132,0 Q143,18 154,0 Q165,18 176,0 Q187,18 198,0 Q209,18 220,0 Q231,18 242,0 Q253,18 264,0 Q275,18 286,0 Q297,18 308,0 Q319,18 330,0 Q341,18 352,0 Q363,18 374,0 Q385,18 396,0 Q407,18 418,0 Q429,18 440,0 L440,18 L0,18 Z" fill="#0D0D22"/>
          </svg>
        </div>
        <div style={{padding:"20px 28px 28px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            {rows.map((row,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"16px"}}>
                <span style={{fontSize:"13px",color:"rgba(255,255,255,0.38)",flexShrink:0}}>{row.label}</span>
                <span style={{fontSize:"13px",fontWeight:700,color:row.valueColor||"white",fontFamily:row.mono?"monospace":"inherit",wordBreak:"break-all",textAlign:"right"}}>{row.value}</span>
              </div>
            ))}
            <div style={{borderTop:"1px dashed rgba(255,255,255,0.1)",paddingTop:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"15px",fontWeight:700,color:"rgba(255,255,255,0.55)"}}>Miqdor</span>
              <span style={{fontSize:"20px",fontWeight:900,color:accent}}>{isOut?"−":"+"}{fmt(tx.amount)} so'm</span>
            </div>
          </div>
          <button onClick={onClose} style={{width:"100%",marginTop:"20px",padding:"14px",background:"linear-gradient(90deg,#6366f1,#8b5cf6)",border:"none",borderRadius:"12px",cursor:"pointer",color:"white",fontSize:"15px",fontWeight:700}}>Yopish</button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ start_date:"", end_date:"", amount:"" });
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedIsOut, setSelectedIsOut] = useState(false);
  const [cardStats, setCardStats] = useState({ income:0, outcome:0, count:0 });
  const cardsRef = useRef([]);

  useEffect(() => {
    cardAPI.getAll().then(r => { setCards(r.data || []); cardsRef.current = r.data || []; }).catch(()=>{});
  }, []);

  useEffect(() => { fetchTransactions(); }, [page, activeFilters, selectedCardId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = { page, limit:10, ...activeFilters };
      if (selectedCardId !== "all") params.card_id = selectedCardId;
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await transactionAPI.getAll(params);
      let data = res.data.data || [];

      // Backend response da from_card_id/to_card_id bo'lmasligi mumkin
      // Shuning uchun card.id ni card_number orqali taqqoslaymiz
      if (selectedCardId !== "all") {
        // selectedCard cards state dan topiladi (cards allaqachon yuklangan)
        // Lekin cards hali bo'sh bo'lsa — card_number ni txdan olamiz
        // Ishonchli yo'l: backend yuborgan card_id params bilan kelgan datani ishlatamiz
        // Faqat from_card.card_number yoki to_card.card_number selectedCard.card_number ga tengmi?
        const selCard = cardsRef.current.find(c => c.id === selectedCardId);
        const selNum = selCard?.card_number;
        if (selNum) {
          data = data.filter(tx =>
            tx.from_card?.card_number === selNum ||
            tx.to_card?.card_number   === selNum
          );
        }
        const income  = data.filter(tx => tx.to_card?.card_number   === selNum).reduce((s,tx)=>s+Number(tx.amount),0);
        const outcome = data.filter(tx => tx.from_card?.card_number === selNum).reduce((s,tx)=>s+Number(tx.amount),0);
        setCardStats({ income, outcome, count: res.data.total||0 });
      }

      setTransactions(data);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch(e){ console.error(e); }
    finally { setLoading(false); }
  };



  const myCardNumbers = new Set(cards.map(c => String(c.card_number)));
  const selectedCard  = cards.find(c => c.id === selectedCardId);

  // ASOSIY QOIDA:
  // from_card null => admin deposit => har doim KIRIM
  // bitta karta tanlangan => from_card.card_number === selectedCard.card_number bo'lsa CHIQIM
  // barcha kartalar => from_card.card_number mening kartalarimdan biri bo'lsa CHIQIM
  const getIsOut = (tx) => {
    const fromNum = tx.from_card?.card_number;
    if (!fromNum) return false;
    if (selectedCardId !== "all" && selectedCard) {
      return String(fromNum) === String(selectedCard.card_number);
    }
    return myCardNumbers.has(String(fromNum));
  };

  const openDetail = (tx) => { setSelectedTx(tx); setSelectedIsOut(getIsOut(tx)); };
  const applyFilter = () => {
    const f = {};
    if (filters.start_date) f.start_date = filters.start_date;
    if (filters.end_date) f.end_date = filters.end_date;
    if (filters.amount) f.amount = filters.amount;
    setActiveFilters(f); setPage(1); setShowFilter(false);
  };
  const clearFilters = () => { setFilters({ start_date:"", end_date:"", amount:"" }); setActiveFilters({}); setPage(1); };
  const hasFilters = Object.keys(activeFilters).length > 0;
  const changeCard = (id) => { setSelectedCardId(id); setPage(1); };

  const grouped = transactions.reduce((acc, tx) => {
    const day = tx.created_at ? tx.created_at.split("T")[0] : "unknown";
    if (!acc[day]) acc[day] = [];
    acc[day].push(tx);
    return acc;
  }, {});

  const iStyle = { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"10px 13px", fontSize:"13px", color:"white", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{width:"100%"}}>
      {selectedTx && <TxDetailModal tx={selectedTx} isOut={selectedIsOut} onClose={()=>setSelectedTx(null)}/>}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
        <div>
          <h1 style={{fontSize:"26px",fontWeight:800,color:"white",marginBottom:"4px"}}>Tranzaksiyalar</h1>
          <p style={{color:"rgba(255,255,255,0.35)",fontSize:"14px"}}>Jami: {total} ta</p>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          {hasFilters && (
            <button onClick={clearFilters} style={{display:"flex",alignItems:"center",gap:"6px",padding:"9px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"10px",cursor:"pointer",color:"#f87171",fontSize:"13px",fontWeight:600}}>
              <X size={13}/> Tozalash
            </button>
          )}
          <button onClick={()=>setShowFilter(!showFilter)} style={{display:"flex",alignItems:"center",gap:"7px",padding:"9px 16px",background:showFilter?"rgba(99,102,241,0.12)":"rgba(255,255,255,0.05)",border:`1px solid ${showFilter?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.1)"}`,borderRadius:"10px",cursor:"pointer",color:showFilter?"#a5b4fc":"rgba(255,255,255,0.55)",fontSize:"13px",fontWeight:600}}>
            <Filter size={14}/> Filtr{hasFilters?` (${Object.keys(activeFilters).length})`:""}
          </button>
        </div>
      </div>

      {cards.length > 1 && (
        <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"}}>
          <button onClick={()=>changeCard("all")} style={{display:"flex",alignItems:"center",gap:"7px",padding:"9px 16px",background:selectedCardId==="all"?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${selectedCardId==="all"?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:"10px",cursor:"pointer",color:selectedCardId==="all"?"#a5b4fc":"rgba(255,255,255,0.45)",fontSize:"13px",fontWeight:600}}>
            <CreditCard size={13}/> Barcha kartalar
          </button>
          {cards.map(card => {
            const isAct = selectedCardId === card.id;
            const dot = card.status?.toUpperCase()==="ACTIVE"?"#4ade80":card.status?.toUpperCase()==="FROZEN"?"#60a5fa":"#f87171";
            return (
              <button key={card.id} onClick={()=>changeCard(card.id)} style={{display:"flex",alignItems:"center",gap:"8px",padding:"9px 16px",background:isAct?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${isAct?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:"10px",cursor:"pointer",color:isAct?"#a5b4fc":"rgba(255,255,255,0.45)",fontSize:"13px",fontWeight:600}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:dot}}/>
                .... {card.card_number?.slice(-4)}
              </button>
            );
          })}
        </div>
      )}

      {selectedCardId !== "all" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"20px"}}>
          <div style={{background:"#0D0D22",border:"1px solid rgba(74,222,128,0.12)",borderRadius:"14px",padding:"14px 18px"}}>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Jami kirim</p>
            <p style={{fontSize:"20px",fontWeight:800,color:"#4ade80"}}>+{fmt(cardStats.income)}</p>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.22)"}}>so'm</p>
          </div>
          <div style={{background:"#0D0D22",border:"1px solid rgba(248,113,113,0.12)",borderRadius:"14px",padding:"14px 18px"}}>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Jami chiqim</p>
            <p style={{fontSize:"20px",fontWeight:800,color:"#f87171"}}>-{fmt(cardStats.outcome)}</p>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.22)"}}>so'm</p>
          </div>
          <div style={{background:"#0D0D22",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"14px 18px"}}>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.06em"}}>Tranzaksiyalar</p>
            <p style={{fontSize:"20px",fontWeight:800,color:"white"}}>{cardStats.count}</p>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.22)"}}>ta</p>
          </div>
        </div>
      )}

      {showFilter && (
        <div style={{background:"#0D0D22",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"20px",marginBottom:"20px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"12px",marginBottom:"16px"}}>
            <div>
              <label style={{display:"block",fontSize:"11px",color:"rgba(255,255,255,0.35)",marginBottom:"6px",textTransform:"uppercase"}}>Boshlanish</label>
              <input type="date" value={filters.start_date} onChange={e=>setFilters({...filters,start_date:e.target.value})} style={iStyle}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",color:"rgba(255,255,255,0.35)",marginBottom:"6px",textTransform:"uppercase"}}>Tugash</label>
              <input type="date" value={filters.end_date} onChange={e=>setFilters({...filters,end_date:e.target.value})} style={iStyle}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",color:"rgba(255,255,255,0.35)",marginBottom:"6px",textTransform:"uppercase"}}>Miqdor</label>
              <input type="number" placeholder="50000" value={filters.amount} onChange={e=>setFilters({...filters,amount:e.target.value})} style={iStyle}/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:"8px"}}>
            <button onClick={()=>setShowFilter(false)} style={{padding:"9px 18px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:"13px"}}>Bekor</button>
            <button onClick={applyFilter} style={{padding:"9px 18px",background:"linear-gradient(90deg,#6366f1,#8b5cf6)",border:"none",borderRadius:"10px",cursor:"pointer",color:"white",fontSize:"13px",fontWeight:700}}>Qo'llash</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:"60px"}}>
          <div style={{width:"32px",height:"32px",border:"3px solid rgba(99,102,241,0.3)",borderTopColor:"#6366f1",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{background:"#0D0D22",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"48px",textAlign:"center"}}>
          <CreditCard size={36} color="rgba(255,255,255,0.1)" style={{margin:"0 auto 12px",display:"block"}}/>
          <p style={{color:"rgba(255,255,255,0.25)",fontSize:"15px"}}>
            {selectedCardId==="all"?"Tranzaksiyalar yo'q":"Bu karta bo'yicha tranzaksiya yo'q"}
          </p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
          {Object.entries(grouped).map(([day,txs])=>(
            <div key={day}>
              <p style={{fontSize:"11px",fontWeight:600,color:"rgba(255,255,255,0.25)",marginBottom:"8px",textTransform:"uppercase",letterSpacing:"0.08em"}}>{fmtDay(day)}</p>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {txs.map(tx=>{
                  const isOut = getIsOut(tx);
                  return (
                    <div key={tx.id} onClick={()=>openDetail(tx)}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0D0D22",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"14px",padding:"13px 18px",cursor:"pointer",transition:"all 0.15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(99,102,241,0.3)";e.currentTarget.style.background="rgba(99,102,241,0.04)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.background="#0D0D22";}}>
                      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                        <div style={{width:"40px",height:"40px",borderRadius:"12px",background:isOut?"rgba(239,68,68,0.1)":"rgba(16,185,129,0.1)",border:`1px solid ${isOut?"rgba(239,68,68,0.2)":"rgba(16,185,129,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {isOut?<ArrowUpRight size={17} color="#f87171"/>:<ArrowDownLeft size={17} color="#4ade80"/>}
                        </div>
                        <div>
                          <p style={{fontSize:"14px",fontWeight:700,color:"white",marginBottom:"3px"}}>
                            {tx.description||(isOut?"Pul yuborish":"Kirim")}
                          </p>
                          <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.28)"}}>{fmtDate(tx.created_at)}</p>
                            {selectedCardId==="all" && tx.from_card?.card_number && tx.to_card?.card_number && (
                              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",fontFamily:"monospace"}}>
                                {tx.from_card.card_number.slice(-4)} to {tx.to_card.card_number.slice(-4)}
                              </span>
                            )}
                            {Number(tx.commission)>0 && (
                              <span style={{fontSize:"10px",padding:"1px 7px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.18)",borderRadius:"999px",color:"#fbbf24"}}>
                                komissiya: {fmt(tx.commission)} so'm
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
                        <div style={{textAlign:"right"}}>
                          <p style={{fontSize:"15px",fontWeight:900,color:isOut?"#f87171":"#4ade80"}}>
                            {isOut?"−":"+"}{fmt(tx.amount)}
                          </p>
                          <p style={{fontSize:"11px",color:"rgba(255,255,255,0.22)"}}>so'm</p>
                        </div>
                        <span style={{color:"rgba(255,255,255,0.2)",fontSize:"20px",lineHeight:1}}>&#x203a;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages>1 && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",marginTop:"24px"}}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
            style={{width:"36px",height:"36px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",cursor:page===1?"not-allowed":"pointer",color:"rgba(255,255,255,0.5)",opacity:page===1?0.4:1}}>
            <ChevronLeft size={16}/>
          </button>
          <span style={{fontSize:"13px",color:"rgba(255,255,255,0.45)"}}>{page} / {totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
            style={{width:"36px",height:"36px",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",cursor:page===totalPages?"not-allowed":"pointer",color:"rgba(255,255,255,0.5)",opacity:page===totalPages?0.4:1}}>
            <ChevronRight size={16}/>
          </button>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
