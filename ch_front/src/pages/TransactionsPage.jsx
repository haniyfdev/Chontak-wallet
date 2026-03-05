import { useEffect, useState } from "react";
import { transactionAPI, cardAPI } from "../api";
import { ArrowUpRight, ArrowDownLeft, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";

function fmt(v) { return Number(v || 0).toLocaleString("uz-UZ"); }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}
function groupByDate(txs) {
  const groups = {};
  txs.forEach(tx => {
    const date = new Date(tx.created_at).toLocaleDateString("uz-UZ", { year: "numeric", month: "2-digit", day: "2-digit" });
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
  });
  return groups;
}

export default function TransactionsPage() {
  const [data, setData] = useState({ data: [], total: 0, total_pages: 1 });
  const [myCards, setMyCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ start_date: "", end_date: "", amount: "" });
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    cardAPI.getAll().then(r => setMyCards(r.data.map(c => c.id)));
  }, []);

  useEffect(() => { fetchTx(); }, [page]);

  const fetchTx = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.amount) params.amount = filters.amount;
      const res = await transactionAPI.getAll(params);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFilter = (e) => { e.preventDefault(); setPage(1); fetchTx(); };
  const clearFilter = () => {
    setFilters({ start_date: "", end_date: "", amount: "" });
    setPage(1); setTimeout(fetchTx, 50);
  };

  const grouped = groupByDate(data.data || []);

  const inputStyle = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "white",
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "4px" }}>Tranzaksiyalar</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Jami: {data.total} ta operatsiya</p>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
            background: showFilter ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${showFilter ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "12px", cursor: "pointer",
            color: showFilter ? "#a5b4fc" : "rgba(255,255,255,0.5)",
            fontSize: "13px", fontWeight: 600,
          }}
        >
          <Filter size={15} />
          Filter
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div style={{ background: "#0D0D22", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
          <form onSubmit={handleFilter}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Boshlanish</label>
                <input type="date" value={filters.start_date} onChange={e => setFilters({ ...filters, start_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Tugash</label>
                <input type="date" value={filters.end_date} onChange={e => setFilters({ ...filters, end_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Miqdor</label>
                <input type="number" placeholder="Summa" value={filters.amount} onChange={e => setFilters({ ...filters, amount: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" style={{ padding: "9px 20px", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Qidirish
              </button>
              <button type="button" onClick={clearFilter} style={{ padding: "9px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "rgba(255,255,255,0.5)", fontSize: "13px", cursor: "pointer" }}>
                Tozalash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : data.data?.length === 0 ? (
        <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "60px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "15px" }}>Tranzaksiyalar topilmadi</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              {/* Sana header */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>{date}</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>{txs.length} ta</span>
              </div>

              {/* O'sha kundagi tranzaksiyalar */}
              <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
                {txs.map((tx, idx) => {
                  const isOut = myCards.includes(tx.from_card_id);
                  return (
                    <div key={tx.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px",
                      borderBottom: idx < txs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
                          background: isOut ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                          border: `1px solid ${isOut ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {isOut
                            ? <ArrowUpRight size={17} color="#f87171" />
                            : <ArrowDownLeft size={17} color="#4ade80" />
                          }
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "3px" }}>
                            {tx.description || (isOut ? "O'tkazma" : "Kirim")}
                          </p>
                          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>{fmtDate(tx.created_at)}</p>
                          {tx.commission > 0 && (
                            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "1px" }}>
                              Komissiya: {fmt(tx.commission)} so'm
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "16px", fontWeight: 800, color: isOut ? "#f87171" : "#4ade80", letterSpacing: "-0.3px" }}>
                          {isOut ? "−" : "+"}{fmt(tx.amount)}
                        </p>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>so'm</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "28px" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", cursor: page === 1 ? "not-allowed" : "pointer", color: "rgba(255,255,255,0.5)", opacity: page === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            {page} / {data.total_pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
            disabled={page === data.total_pages}
            style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", cursor: page === data.total_pages ? "not-allowed" : "pointer", color: "rgba(255,255,255,0.5)", opacity: page === data.total_pages ? 0.4 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}