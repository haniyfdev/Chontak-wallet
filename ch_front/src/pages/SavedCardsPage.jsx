import { useEffect, useState } from "react";
import { savedCardAPI } from "../api";
import { BookmarkCheck, Plus, Trash2, Edit3, X, Check, Loader } from "lucide-react";

export default function SavedCardsPage() {
  const [data, setData] = useState({ data: [], total_saved_cards: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editAlias, setEditAlias] = useState("");
  const [addForm, setAddForm] = useState({ card_number: "", card_holder_name: "", alias: "" });
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { const res = await savedCardAPI.getAll(); setData(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault(); setActionLoading("add"); setError("");
    try {
      await savedCardAPI.save(addForm);
      setAddForm({ card_number: "", card_holder_name: "", alias: "" });
      setShowAdd(false); await fetchData();
    } catch (e) { setError(e.response?.data?.detail || "Xatolik"); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try { await savedCardAPI.delete(id); await fetchData(); }
    catch (e) { setError(e.response?.data?.detail || "Xatolik"); }
    finally { setActionLoading(null); }
  };

  const handleEditSave = async (id) => {
    setActionLoading(id + "_edit");
    try { await savedCardAPI.updateAlias(id, { alias: editAlias }); setEditId(null); await fetchData(); }
    catch (e) { setError(e.response?.data?.detail || "Xatolik"); }
    finally { setActionLoading(null); }
  };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", padding: "13px 16px", fontSize: "14px", color: "white",
    outline: "none", boxSizing: "border-box", fontWeight: 500,
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", marginBottom: "4px" }}>Saqlangan kartalar</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>{data.total_saved_cards} ta karta saqlangan</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", background: showAdd ? "rgba(255,255,255,0.07)" : "linear-gradient(90deg, #6366f1, #8b5cf6)", border: showAdd ? "1px solid rgba(255,255,255,0.12)" : "none", borderRadius: "12px", cursor: "pointer", color: "white", fontSize: "14px", fontWeight: 700, boxShadow: showAdd ? "none" : "0 4px 16px rgba(99,102,241,0.35)" }}
        >
          {showAdd ? <X size={15} /> : <Plus size={15} />}
          {showAdd ? "Bekor" : "Saqlash"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#f87171" }}>{error}</div>
      )}

      {showAdd && (
        <div style={{ background: "#0D0D22", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "20px", padding: "24px", marginBottom: "20px" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "18px" }}>Karta saqlash</p>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Karta raqami</label>
              <input type="text" placeholder="1234567890123456" value={addForm.card_number} onChange={e => setAddForm({ ...addForm, card_number: e.target.value.replace(/\s/g, "") })} maxLength={16} style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.1em" }} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Egasi ismi</label>
                <input type="text" placeholder="Ism Familiya" value={addForm.card_holder_name} onChange={e => setAddForm({ ...addForm, card_holder_name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Taxallus</label>
                <input type="text" placeholder="Masalan: Do'stim" value={addForm.alias} onChange={e => setAddForm({ ...addForm, alias: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <button type="submit" disabled={actionLoading === "add"} style={{ padding: "13px", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "12px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
              {actionLoading === "add" ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : data.data?.length === 0 ? (
        <div style={{ background: "#0D0D22", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: "20px", padding: "60px", textAlign: "center" }}>
          <BookmarkCheck size={36} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "15px", fontWeight: 600 }}>Saqlangan kartalar yo'q</p>
        </div>
      ) : (
        <div style={{ background: "#0D0D22", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", overflow: "hidden" }}>
          {data.data.map((sc, idx) => (
            <div key={sc.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", borderBottom: idx < data.data.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BookmarkCheck size={17} color="#818cf8" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editId === sc.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="text" value={editAlias} onChange={e => setEditAlias(e.target.value)} autoFocus style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", color: "white", outline: "none" }} />
                    <button onClick={() => handleEditSave(sc.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ade80" }}><Check size={15} /></button>
                    <button onClick={() => setEditId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}><X size={15} /></button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sc.alias || sc.card_holder_name}</p>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginTop: "2px" }}>**** **** **** {sc.card_number?.slice(-4)}</p>
                  </>
                )}
              </div>
              {editId !== sc.id && (
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button onClick={() => { setEditId(sc.id); setEditAlias(sc.alias || ""); }} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => handleDelete(sc.id)} disabled={actionLoading === sc.id} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", cursor: "pointer", color: "#f87171" }}>
                    {actionLoading === sc.id ? <Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={13} />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}