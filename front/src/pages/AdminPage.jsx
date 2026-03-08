import { useEffect, useState } from "react";
import { adminAPI } from "../api";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import {
  Users, CreditCard, ArrowLeftRight, ShieldCheck,
  Search, ChevronLeft, ChevronRight, BarChart3,
  TrendingUp, TrendingDown, DollarSign, RefreshCw,
  CheckCircle, XCircle, Crown, UserX, Send, Wallet,
  AlertTriangle, Eye, Scale
} from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const TABS = [
  { key: "dashboard", icon: BarChart3,      label: "Dashboard" },
  { key: "users",     icon: Users,           label: "Foydalanuvchilar" },
  { key: "cards",     icon: CreditCard,      label: "Kartalar" },
  { key: "txs",       icon: ArrowLeftRight,  label: "Tranzaksiyalar" },
  { key: "deposit",   icon: Send,            label: "Depozit" },
  { key: "verify",    icon: Scale,           label: "Balans tekshiruv" },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Dashboard
  const [dash, setDash] = useState(null);
  const [calendar, setCalendar] = useState(new Date().toISOString().split("T")[0]);

  // Users
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Cards
  const [adminCards, setAdminCards] = useState([]);
  const [cardTotal, setCardTotal] = useState(0);
  const [cardPage, setCardPage] = useState(1);
  const [cardPages, setCardPages] = useState(1);
  const [cardSearch, setCardSearch] = useState("");

  // Transactions
  const [txs, setTxs] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txPages, setTxPages] = useState(1);
  const [txFilters, setTxFilters] = useState({ card_number: "", start_date: "", end_date: "" });

  // Deposit
  const [platformCard, setPlatformCard] = useState(null);
  const [depositForm, setDepositForm] = useState({ from_card_id: "", to_card_number: "", amount: "", description: "" });
  const [depositLoading, setDepositLoading] = useState(false);

  // Verify
  const [verifyData, setVerifyData] = useState(null);
  const [verifySearch, setVerifySearch] = useState("");
  const [verifyPage, setVerifyPage] = useState(1);
  const [verifyCardId, setVerifyCardId] = useState("");
  const [verifyOneData, setVerifyOneData] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "ADMIN") { navigate("/dashboard"); return; }
    if (tab === "dashboard") fetchDashboard();
    else if (tab === "users") fetchUsers();
    else if (tab === "cards") fetchCards();
    else if (tab === "txs") fetchTxs();
    else if (tab === "deposit") fetchPlatformCard();
    else if (tab === "verify") fetchVerify();
  }, [tab, userPage, cardPage, txPage, verifyPage, calendar]);

  const showMsg = (text, type = "ok") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3500);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try { const r = await adminAPI.getDashboard(calendar); setDash(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page: userPage, limit: 10 };
      if (userSearch.length >= 3) params.search_name = userSearch;
      const r = await adminAPI.getAllUsers(params);
      setUsers(r.data.data || []);
      setUserTotal(r.data.total_users || 0);
      setUserPages(r.data.total_pages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUserDetail = async (userId) => {
    setUserDetailLoading(true);
    try {
      const r = await adminAPI.getOneUser(userId);
      setSelectedUser(r.data);
    } catch (e) { console.error(e); }
    finally { setUserDetailLoading(false); }
  };

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = { page: cardPage, limit: 10 };
      if (cardSearch.length >= 2) params.search_card_number = cardSearch;
      const r = await adminAPI.getAllCards(params);
      setAdminCards(r.data.data || []);
      setCardTotal(r.data.total_cards || 0);
      setCardPages(r.data.total_pages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTxs = async () => {
    setLoading(true);
    try {
      const params = { page: txPage, limit: 10 };
      if (txFilters.card_number.length === 16) params.card_number = txFilters.card_number;
      if (txFilters.start_date) params.start_date = txFilters.start_date;
      if (txFilters.end_date) params.end_date = txFilters.end_date;
      const r = await adminAPI.getAllTransactions(params);
      setTxs(r.data.data || []);
      setTxTotal(r.data.total || 0);
      setTxPages(r.data.total_pages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchPlatformCard = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getPlatformCard();
      setPlatformCard(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDeposit = async () => {
    if (!depositForm.from_card_id || !depositForm.to_card_number || !depositForm.amount) {
      showMsg("Barcha maydonlarni to'ldiring", "err"); return;
    }
    setDepositLoading(true);
    try {
      await adminAPI.deposit({
        from_card_id: depositForm.from_card_id,
        to_card_number: depositForm.to_card_number,
        amount: Number(depositForm.amount),
        description: depositForm.description || "Admin depozit",
      });
      setDepositForm({ from_card_id: "", to_card_number: "", amount: "", description: "" });
      showMsg("Depozit muvaffaqiyatli amalga oshirildi! ✅");
      fetchPlatformCard();
    } catch (e) { showMsg(e.response?.data?.detail || "Xatolik", "err"); }
    finally { setDepositLoading(false); }
  };

  const fetchVerify = async () => {
    setLoading(true);
    try {
      const params = { page: verifyPage, limit: 16 };
      if (verifySearch.length >= 4) params.search_number = verifySearch;
      const r = await adminAPI.verifyAllBalances(params);
      setVerifyData(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleVerifyOne = async () => {
    if (!verifyCardId) { showMsg("Card ID kiriting", "err"); return; }
    try {
      const r = await adminAPI.verifyOneBalance(verifyCardId);
      setVerifyOneData(r.data);
    } catch (e) { showMsg(e.response?.data?.detail || "Xatolik", "err"); }
  };

  const handleUserRole = async (userId, action) => {
    try {
      await adminAPI.updateUserRole(userId, action);
      await fetchUsers();
      if (selectedUser?.id === userId) fetchUserDetail(userId);
      showMsg("Foydalanuvchi roli yangilandi!");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "err"); }
  };

  const handleCardStatus = async (cardId, status) => {
    try {
      await adminAPI.updateCardStatus(cardId, status);
      await fetchCards();
      showMsg("Karta statusi yangilandi!");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "err"); }
  };

  if (!user) return <div style={{display:"flex",justifyContent:"center",padding:"80px"}}><div style={{width:"32px",height:"32px",border:"3px solid rgba(99,102,241,0.3)",borderTopColor:"#6366f1",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{"@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}"}</style></div>;
  if (user.role !== "ADMIN") return null;

  const sStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 13px 10px 36px", fontSize: "13px", color: "white", outline: "none", boxSizing: "border-box" };
  const iStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "11px 14px", fontSize: "13px", color: "white", outline: "none", boxSizing: "border-box" };
  const statusColors = { ACTIVE: "#4ade80", FROZEN: "#60a5fa", CLOSED: "#f87171" };
  const statusLabels = { ACTIVE: "Faol", FROZEN: "Muzlatilgan", CLOSED: "Yopilgan" };
  const roleColors = { USER: "rgba(255,255,255,0.3)", PREMIUM: "#fbbf24", ADMIN: "#f87171" };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={17} color="#f87171" />
        </div>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "white" }}>Admin Panel</h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Tizim boshqaruvi</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "4px", marginBottom: "24px", overflowX: "auto" }}>
        {TABS.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, minWidth: "110px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "11px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: tab === key ? "#0D0D22" : "transparent", color: tab === key ? "white" : "rgba(255,255,255,0.38)", boxShadow: tab === key ? "0 2px 8px rgba(0,0,0,0.3)" : "none", whiteSpace: "nowrap" }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {msg.text && (
        <div style={{ background: msg.type === "err" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${msg.type === "err" ? "rgba(239,68,68,0.22)" : "rgba(16,185,129,0.22)"}`, borderRadius: "12px", padding: "11px 15px", marginBottom: "16px", fontSize: "13px", color: msg.type === "err" ? "#f87171" : "#4ade80" }}>
          {msg.text}
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {tab === "dashboard" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <input type="date" value={calendar} onChange={e => setCalendar(e.target.value)}
              style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "9px 13px", fontSize: "13px", color: "white", outline: "none" }} />
            <button onClick={fetchDashboard} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", cursor: "pointer", color: "#a5b4fc", fontSize: "13px", fontWeight: 600 }}>
              <RefreshCw size={14} /> Yangilash
            </button>
          </div>
          {loading ? <Spinner /> : dash && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "Umumiy balans",  value: `${fmt(dash.total_balance)} so'm`,          icon: DollarSign,  color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
                  { label: "Komissiya",       value: `${fmt(dash.total_commission)} so'm`,        icon: TrendingUp,  color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
                  { label: "Chiquvchi",       value: `${fmt(dash.sender_transactions)} so'm`,     icon: TrendingDown, color: "#f87171", bg: "rgba(248,113,113,0.1)" },
                  { label: "Kiruvchi",        value: `${fmt(dash.receiver_transactions)} so'm`,   icon: TrendingUp,  color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={17} color={color} /></div>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{label}</p>
                    </div>
                    <p style={{ fontSize: "18px", fontWeight: 900, color: "white" }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px" }}>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "14px" }}>Tranzaksiya statistikasi</p>
                  <p style={{ fontSize: "28px", fontWeight: 900, color: "white", marginBottom: "14px" }}>{dash.total_count} ta</p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", marginBottom: "4px" }}><CheckCircle size={13} color="#4ade80" /><span style={{ fontSize: "11px", color: "#4ade80", fontWeight: 600 }}>Muvaffaqiyatli</span></div>
                      <p style={{ fontSize: "18px", fontWeight: 900, color: "white" }}>{dash.success_transfers_count}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{dash.success_percent}%</p>
                    </div>
                    <div style={{ flex: 1, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", marginBottom: "4px" }}><XCircle size={13} color="#f87171" /><span style={{ fontSize: "11px", color: "#f87171", fontWeight: 600 }}>Muvaffaqiyatsiz</span></div>
                      <p style={{ fontSize: "18px", fontWeight: 900, color: "white" }}>{dash.failed_transfers_count}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{dash.failed_percent}%</p>
                    </div>
                  </div>
                </div>
                <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px" }}>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>Muvaffaqiyat darajasi</p>
                  <p style={{ fontSize: "44px", fontWeight: 900, color: "#4ade80", marginBottom: "14px" }}>{dash.success_percent}%</p>
                  <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "999px", height: "8px", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg,#4ade80,#22c55e)", borderRadius: "999px", width: `${Math.min(100, parseFloat(dash.success_percent) || 0)}%`, transition: "width 1s ease" }} />
                  </div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", marginTop: "8px" }}>{dash.success_transfers_count} / {dash.total_count} tranzaksiya</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedUser ? "1fr 380px" : "1fr", gap: "16px" }}>
          <div>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Search size={14} color="rgba(255,255,255,0.22)" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type="text" placeholder="Ism bo'yicha qidiring (min 3 ta belgi)..." value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); if (e.target.value.length === 0 || e.target.value.length >= 3) fetchUsers(); }}
                style={sStyle} />
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Jami: {userTotal} ta foydalanuvchi</p>
            {loading ? <Spinner /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {users.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: selectedUser?.id === u.id ? "rgba(99,102,241,0.08)" : "#0D0D22", border: `1px solid ${selectedUser?.id === u.id ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: "14px", padding: "14px 18px", cursor: "pointer", transition: "all 0.2s" }}
                    onClick={() => fetchUserDetail(u.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                        {u.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>{u.full_name}</p>
                          <span style={{ fontSize: "10px", padding: "1px 8px", background: u.role === "PREMIUM" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${u.role === "PREMIUM" ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.1)"}`, borderRadius: "999px", color: roleColors[u.role] || "white", fontWeight: 600 }}>{u.role}</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.32)" }}>{u.phone_number}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button onClick={e => { e.stopPropagation(); handleUserRole(u.id, u.role !== "PREMIUM" ? "PREMIUM" : "USER"); }}
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", background: u.role !== "PREMIUM" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.06)", border: `1px solid ${u.role !== "PREMIUM" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.1)"}`, borderRadius: "9px", cursor: "pointer", color: u.role !== "PREMIUM" ? "#fbbf24" : "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600 }}>
                        {u.role !== "PREMIUM" ? <><Crown size={12} /> Premium</> : <><UserX size={12} /> Bekor</>}
                      </button>
                      <div style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.08)", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.15)" }}>
                        <Eye size={13} color="#818cf8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination page={userPage} pages={userPages} setPage={setUserPage} />
          </div>

          {/* User detail panel */}
          {selectedUser && (
            <div style={{ background: "#0D0D22", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "18px", padding: "20px", alignSelf: "start", position: "sticky", top: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>Foydalanuvchi ma'lumotlari</p>
                <button onClick={() => setSelectedUser(null)} style={{ width: "26px", height: "26px", borderRadius: "7px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>×</button>
              </div>
              {userDetailLoading ? <Spinner /> : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                      {selectedUser.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 800, color: "white" }}>{selectedUser.full_name}</p>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{selectedUser.phone_number}</p>
                      <span style={{ fontSize: "10px", padding: "2px 8px", background: selectedUser.role === "PREMIUM" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${selectedUser.role === "PREMIUM" ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.1)"}`, borderRadius: "999px", color: roleColors[selectedUser.role] || "white", fontWeight: 600 }}>{selectedUser.role}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "10px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Kartalar ({selectedUser.cards?.length || 0} ta)</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                    {(selectedUser.cards || []).map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: statusColors[c.status] || "#888" }} />
                          <span style={{ fontSize: "13px", color: "white", fontFamily: "monospace" }}>•••• {c.card_number?.slice(-4)}</span>
                          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{statusLabels[c.status]}</span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{fmt(c.balance)} so'm</span>
                      </div>
                    ))}
                    {(!selectedUser.cards || selectedUser.cards.length === 0) && (
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "12px" }}>Karta yo'q</p>
                    )}
                  </div>

                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
                    Ro'yxatdan o'tgan: {fmtDate(selectedUser.created_at)}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CARDS ── */}
      {tab === "cards" && (
        <div>
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Search size={14} color="rgba(255,255,255,0.22)" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input type="text" placeholder="Karta raqami bo'yicha qidiring..." value={cardSearch}
              onChange={e => { setCardSearch(e.target.value); setCardPage(1); if (e.target.value.length === 0 || e.target.value.length >= 2) fetchCards(); }}
              style={sStyle} />
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Jami: {cardTotal} ta karta</p>
          {loading ? <Spinner /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {adminCards.map(card => (
                <div key={card.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CreditCard size={17} color="#818cf8" />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "white", fontFamily: "monospace", letterSpacing: "0.05em" }}>•••• {card.card_number?.slice(-4)}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "1px 8px", background: `${statusColors[card.status]}18`, border: `1px solid ${statusColors[card.status]}30`, borderRadius: "999px" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: statusColors[card.status] }} />
                          <span style={{ fontSize: "10px", color: statusColors[card.status], fontWeight: 600 }}>{statusLabels[card.status]}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.32)" }}>
                        {card.user?.full_name || "—"} • {fmt(card.balance)} so'm
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {card.status !== "ACTIVE" && (
                      <button onClick={() => handleCardStatus(card.id, "ACTIVE")} style={{ padding: "6px 11px", background: "rgba(74,222,128,0.09)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: "8px", cursor: "pointer", color: "#4ade80", fontSize: "11px", fontWeight: 600 }}>Faollashtirish</button>
                    )}
                    {card.status !== "FROZEN" && card.status !== "CLOSED" && (
                      <button onClick={() => handleCardStatus(card.id, "FROZEN")} style={{ padding: "6px 11px", background: "rgba(96,165,250,0.09)", border: "1px solid rgba(96,165,250,0.18)", borderRadius: "8px", cursor: "pointer", color: "#60a5fa", fontSize: "11px", fontWeight: 600 }}>Muzlatish</button>
                    )}
                    {card.status !== "CLOSED" && (
                      <button onClick={() => handleCardStatus(card.id, "CLOSED")} style={{ padding: "6px 11px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)", borderRadius: "8px", cursor: "pointer", color: "#f87171", fontSize: "11px", fontWeight: 600 }}>Yopish</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={cardPage} pages={cardPages} setPage={setCardPage} />
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {tab === "txs" && (
        <div>
          {/* Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px", marginBottom: "16px" }}>
            <input type="text" placeholder="Karta raqami (16 raqam)" value={txFilters.card_number}
              onChange={e => setTxFilters(f => ({ ...f, card_number: e.target.value.replace(/\D/g, "").slice(0, 16) }))}
              style={iStyle} />
            <input type="date" value={txFilters.start_date}
              onChange={e => setTxFilters(f => ({ ...f, start_date: e.target.value }))}
              style={iStyle} />
            <input type="date" value={txFilters.end_date}
              onChange={e => setTxFilters(f => ({ ...f, end_date: e.target.value }))}
              style={iStyle} />
            <button onClick={() => { setTxPage(1); fetchTxs(); }}
              style={{ padding: "11px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", cursor: "pointer", color: "#a5b4fc", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
              <Search size={13} /> Qidirish
            </button>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Jami: {txTotal} ta tranzaksiya</p>
          {loading ? <Spinner /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {txs.map(tx => (
                <div key={tx.id} style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: tx.status === "SUCCESS" || tx.status === "success" ? "rgba(74,222,128,0.09)" : "rgba(239,68,68,0.09)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {tx.status === "SUCCESS" || tx.status === "success" ? <CheckCircle size={17} color="#4ade80" /> : <XCircle size={17} color="#f87171" />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{tx.description || tx.type || "Transfer"}</p>
                        {tx.commission > 0 && (
                          <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: "999px", color: "#fbbf24" }}>kom: {fmt(tx.commission)}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)" }}>{fmtDate(tx.created_at)}</p>
                        {tx.from_card && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", fontFamily: "monospace" }}>↑ •••{tx.from_card.card_number?.slice(-4)}</p>}
                        {tx.to_card && <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.22)", fontFamily: "monospace" }}>↓ •••{tx.to_card.card_number?.slice(-4)}</p>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "15px", fontWeight: 900, color: "white" }}>{fmt(tx.amount)}</p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>so'm</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={txPage} pages={txPages} setPage={setTxPage} />
        </div>
      )}

      {/* ── DEPOSIT ── */}
      {tab === "deposit" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Platform card */}
          <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <Wallet size={17} color="#818cf8" />
              <p style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>Platform kartasi</p>
            </div>
            {loading ? <Spinner /> : platformCard ? (
              <div>
                <div style={{ borderRadius: "16px", padding: "20px", background: "linear-gradient(135deg,#1e1b4b,#3730a3,#4f46e5)", marginBottom: "16px", boxShadow: "0 12px 40px rgba(99,102,241,0.3)" }}>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.1em" }}>PLATFORM KARTA</p>
                  <p style={{ fontSize: "16px", fontWeight: 900, color: "white", fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: "16px" }}>
                    {platformCard.card_number?.match(/.{1,4}/g)?.join("  ")}
                  </p>
                  <p style={{ fontSize: "20px", fontWeight: 900, color: "white" }}>{fmt(platformCard.balance)} so'm</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "4px" }}>Status</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: statusColors[platformCard.status] }} />
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{statusLabels[platformCard.status]}</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "4px" }}>Muddati</p>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{platformCard.expiry_date?.slice(0, 7) || "—"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Platform karta topilmadi</p>
            )}
          </div>

          {/* Deposit form */}
          <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <Send size={17} color="#4ade80" />
              <p style={{ fontSize: "15px", fontWeight: 700, color: "white" }}>Depozit yuborish</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.38)", marginBottom: "7px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Manba karta ID (UUID)</label>
                <input value={depositForm.from_card_id} onChange={e => setDepositForm(f => ({ ...f, from_card_id: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={iStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.38)", marginBottom: "7px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Qabul qiluvchi karta raqami</label>
                <input value={depositForm.to_card_number} onChange={e => setDepositForm(f => ({ ...f, to_card_number: e.target.value.replace(/\D/g, "").slice(0, 16) }))}
                  placeholder="1234567890123456" style={iStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.38)", marginBottom: "7px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Miqdor (so'm)</label>
                <input type="number" value={depositForm.amount} onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="100000" style={iStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.38)", marginBottom: "7px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Izoh (ixtiyoriy)</label>
                <input value={depositForm.description} onChange={e => setDepositForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="To'lov maqsadi..." style={iStyle} />
              </div>
              <button onClick={handleDeposit} disabled={depositLoading}
                style={{ padding: "13px", background: depositLoading ? "rgba(99,102,241,0.4)" : "linear-gradient(90deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "12px", cursor: depositLoading ? "not-allowed" : "pointer", color: "white", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {depositLoading ? <><div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Yuborilmoqda...</> : <><Send size={15} /> Depozit yuborish</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VERIFY BALANCE ── */}
      {tab === "verify" && (
        <div>
          {/* Stats */}
          {verifyData && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Jami kartalar", value: verifyData.total_cards, color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
                { label: "To'g'ri balans", value: verifyData.total_valid_cards, color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
                { label: "Xato balans", value: verifyData.total_invalid_cards, color: "#f87171", bg: "rgba(239,68,68,0.1)" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <Scale size={18} color={color} />
                  </div>
                  <p style={{ fontSize: "26px", fontWeight: 900, color, marginBottom: "4px" }}>{value}</p>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters row */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} color="rgba(255,255,255,0.22)" style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type="text" placeholder="Karta raqami (min 4 ta belgi)..." value={verifySearch}
                onChange={e => setVerifySearch(e.target.value)}
                style={sStyle} />
            </div>
            <button onClick={() => { setVerifyPage(1); fetchVerify(); }}
              style={{ padding: "10px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", cursor: "pointer", color: "#a5b4fc", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Bug cards */}
          {loading ? <Spinner /> : verifyData && (
            <div>
              {verifyData.bug_details?.length > 0 ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "10px" }}>
                    <AlertTriangle size={14} color="#f87171" />
                    <p style={{ fontSize: "13px", color: "#f87171", fontWeight: 600 }}>{verifyData.bug_details.length} ta kartada balans nomuvofiqlik topildi!</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {verifyData.bug_details.map((b, i) => (
                      <div key={i} style={{ background: "#0D0D22", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "white", fontFamily: "monospace" }}>{b.card_number}</p>
                          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "3px" }}>
                            Saqlangan: {fmt(b.stored_balance)} • Hisoblangan: {fmt(b.calculated_balance)}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "14px", fontWeight: 900, color: b.difference > 0 ? "#f87171" : "#4ade80" }}>
                            {b.difference > 0 ? "+" : ""}{fmt(b.difference)} so'm
                          </p>
                          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>farq</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", background: "#0D0D22", borderRadius: "16px", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <CheckCircle size={36} color="#4ade80" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#4ade80" }}>Barcha balanslar to'g'ri!</p>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>Nomuvofiqlik topilmadi</p>
                </div>
              )}
            </div>
          )}

          {/* One card verify */}
          <div style={{ marginTop: "20px", background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "14px" }}>Bitta karta tekshirish</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <input value={verifyCardId} onChange={e => setVerifyCardId(e.target.value)}
                placeholder="Karta ID (UUID)..." style={{ ...iStyle, flex: 1 }} />
              <button onClick={handleVerifyOne}
                style={{ padding: "11px 18px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", cursor: "pointer", color: "#a5b4fc", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>
                Tekshirish
              </button>
            </div>
            {verifyOneData && (
              <div style={{ marginTop: "14px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: `1px solid ${verifyOneData.audit?.status === "OK" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                <div style={{ display: "flex", justify: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "3px" }}>Karta raqami</p>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "white", fontFamily: "monospace" }}>{verifyOneData.card_info?.number}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "3px" }}>Saqlangan balans</p>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{fmt(verifyOneData.audit?.stored_balance)} so'm</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "3px" }}>Hisoblangan</p>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{fmt(verifyOneData.audit?.calculated_balance)} so'm</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "3px" }}>Status</p>
                    <span style={{ fontSize: "12px", padding: "3px 10px", background: verifyOneData.audit?.status === "OK" ? "rgba(74,222,128,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${verifyOneData.audit?.status === "OK" ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: "999px", color: verifyOneData.audit?.status === "OK" ? "#4ade80" : "#f87171", fontWeight: 700 }}>
                      {verifyOneData.audit?.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Pagination page={verifyPage} pages={verifyData?.total_page || 1} setPage={setVerifyPage} />
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
      <div style={{ width: "28px", height: "28px", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function Pagination({ page, pages, setPage }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
        style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px", cursor: "pointer", color: "rgba(255,255,255,0.5)", opacity: page === 1 ? 0.4 : 1 }}>
        <ChevronLeft size={15} />
      </button>
      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>{page} / {pages}</span>
      <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
        style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px", cursor: "pointer", color: "rgba(255,255,255,0.5)", opacity: page === pages ? 0.4 : 1 }}>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
