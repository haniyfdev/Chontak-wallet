import { useEffect, useState } from "react";
import { savedCardAPI } from "../api";
import { BookmarkPlus, Trash2, Edit3, Check, X, Loader, Search, CreditCard } from "lucide-react";

export default function SavedCardsPage() {
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ card_number: "", card_holder_name: "", alias: "" });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editAlias, setEditAlias] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { fetchCards(); }, [page, search]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (search.length >= 2) params.search_alias = search;
      const res = await savedCardAPI.getAll(params);
      setCards(res.data.data || []);
      setTotal(res.data.total_saved_cards || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showMsg = (text, type = "success") => {
    if (type === "success") setSuccess(text);
    else setError(text);
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (addForm.card_number.length !== 16) { setError("16 raqamli karta raqam kiriting"); return; }
    setAdding(true); setError("");
    try {
      await savedCardAPI.save(addForm);
      setAddForm({ card_number: "", card_holder_name: "", alias: "" });
      setShowAdd(false);
      await fetchCards();
      showMsg("Karta saqlandi!");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "error"); }
    finally { setAdding(false); }
  };

  const handleEditSave = async (id) => {
    try {
      await savedCardAPI.updateAlias(id, { alias: editAlias });
      setEditId(null);
      await fetchCards();
      showMsg("Alias yangilandi!");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "error"); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await savedCardAPI.delete(id);
      await fetchCards();
      showMsg("Karta o'chirildi!");
    } catch (err) { showMsg(err.response?.data?.detail || "Xatolik", "error"); }
    finally { setDeletingId(null); }
  };

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "11px 14px", fontSize: "13px", color: "white", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "4px" }}>Saqlangan kartalar</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Jami: {total} ta</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 18px", background: showAdd ? "rgba(99,102,241,0.15)" : "linear-gradient(90deg, #6366f1, #8b5cf6)", border: showAdd ? "1px solid rgba(99,102,241,0.3)" : "none", borderRadius: "12px", cursor: "pointer", color: "white", fontSize: "14px", fontWeight: 700 }}>
          <BookmarkPlus size={15} /> {showAdd ? "Bekor" : "Qo'shish"}
        </button>
      </div>

      {/* Messages */}
      {success && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#4ade80" }}>{success}</div>}
      {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#f87171" }}>{error}</div>}

      {/* Add form */}
      {showAdd && (
        <div style={{ background: "#0D0D22", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "16px" }}>Yangi karta qo'shish</p>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", textTransform: "uppercase" }}>Karta raqami *</label>
                <input type="text" inputMode="numeric" placeholder="1234567890123456"
                  value={addForm.card_number}
                  onChange={e => setAddForm({ ...addForm, card_number: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                  style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.06em" }} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", textTransform: "uppercase" }}>Egasi *</label>
                <input type="text" placeholder="Ism Familiya"
                  value={addForm.card_holder_name}
                  onChange={e => setAddForm({ ...addForm, card_holder_name: e.target.value })}
                  style={inputStyle} required />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", textTransform: "uppercase" }}>Alias (ixtiyoriy)</label>
              <input type="text" placeholder="Masalan: Dadamning kartasi"
                value={addForm.alias}
                onChange={e => setAddForm({ ...addForm, alias: e.target.value })}
                style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "9px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>Bekor</button>
              <button type="submit" disabled={adding} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "10px", cursor: "pointer", color: "white", fontSize: "13px", fontWeight: 700 }}>
                {adding ? <Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={13} />}
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search size={15} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input type="text" placeholder="Alias bo'yicha qidiring..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: "100%", background: "#0D0D22", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "11px 16px 11px 40px", fontSize: "14px", color: "white", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : cards.length === 0 ? (
        <div style={{ background: "#0D0D22", border: "2px dashed rgba(255,255,255,0.08)", borderRadius: "16px", padding: "48px", textAlign: "center" }}>
          <CreditCard size={36} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 10px" }} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Saqlangan karta yo'q</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {cards.map(card => (
            <div key={card.id} style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CreditCard size={17} color="#818cf8" />
                </div>
                <div>
                  {editId === card.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input type="text" value={editAlias} onChange={e => setEditAlias(e.target.value)}
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", padding: "5px 10px", fontSize: "13px", color: "white", outline: "none" }}
                        autoFocus />
                      <button onClick={() => handleEditSave(card.id)} style={{ background: "rgba(16,185,129,0.15)", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#4ade80" }}><Check size={13} /></button>
                      <button onClick={() => setEditId(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={13} /></button>
                    </div>
                  ) : (
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "white", marginBottom: "2px" }}>
                      {card.alias || card.card_holder_name}
                    </p>
                  )}
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: "0.06em" }}>
                    •••• •••• •••• {card.card_number?.slice(-4)}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => { setEditId(card.id); setEditAlias(card.alias || ""); }}
                  style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.color = "#a5b4fc"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                  <Edit3 size={13} />
                </button>
                <button onClick={() => handleDelete(card.id)} disabled={deletingId === card.id}
                  style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", cursor: "pointer", color: "#f87171" }}>
                  {deletingId === card.id ? <Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: "32px", height: "32px", borderRadius: "8px", background: p === page ? "#6366f1" : "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", color: p === page ? "white" : "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: 600 }}>
              {p}
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}