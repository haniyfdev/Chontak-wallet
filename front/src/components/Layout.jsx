import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import useAuthStore from "../store/authStore";
import {
  LayoutDashboard, ArrowLeftRight, Send, CreditCard,
  BookmarkCheck, Crown, User, LogOut, Menu, X,
  Bell, ChevronDown, ShieldCheck
} from "lucide-react";

const BASE_URL = "https://chontak-wallet.onrender.com";

const navItems = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight,  label: "Tranzaksiyalar" },
  { to: "/send",         icon: Send,            label: "Pul yuborish" },
  { to: "/cards",        icon: CreditCard,      label: "Kartalarim" },
  { to: "/saved-cards",  icon: BookmarkCheck,   label: "Saqlangan" },
  { to: "/subscription", icon: Crown,           label: "Premium" },
  { to: "/profile",      icon: User,            label: "Profil" },
];

function UserAvatar({ user, size = 32, radius = 10 }) {
  const avatarUrl = user?.avatar?.photo_url ? `${BASE_URL}${user.avatar.photo_url}` : null;
  const initials = user?.full_name?.[0]?.toUpperCase() || "U";
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: `${radius}px`,
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: `${Math.round(size * 0.4)}px`, fontWeight: 700,
      flexShrink: 0, overflow: "hidden", color: "white",
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt="av" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.style.display = "none"; }} />
        : initials}
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logout, user, fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const isPremium = user?.role?.toUpperCase() === "PREMIUM" || isAdmin;
  if (user) console.log("[Layout] user.role =", JSON.stringify(user.role), "isAdmin =", isAdmin);

  useEffect(() => { if (!user) fetchMe(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div style={{
      width: "240px", height: "100%", background: "#0D0D22",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
            <img src="/icons/chontak.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "17px", color: "white" }}>Cho'ntak</span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="mobile-close"
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex" }}>
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 14px", borderRadius: "12px", textDecoration: "none",
              fontSize: "14px", fontWeight: isActive ? 600 : 500,
              transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
              color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.45)",
              border: isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
              boxShadow: isActive ? "0 4px 16px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.className.includes("active")) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.className.includes("active")) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.border = "1px solid transparent";
              }
            }}>
            <Icon size={16} />
            {label}
            {label === "Premium" && !isPremium && (
              <span style={{ marginLeft: "auto", fontSize: "10px", padding: "2px 7px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "999px", color: "#fbbf24", fontWeight: 600 }}>NEW</span>
            )}
          </NavLink>
        ))}

        {/* Boshqaruv - faqat Admin uchun */}
        {isAdmin && (
          <NavLink to="/admin-control" onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 14px", borderRadius: "12px", textDecoration: "none",
              fontSize: "14px", fontWeight: 600, marginTop: "4px",
              transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              background: isActive ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
              color: isActive ? "#fca5a5" : "rgba(248,113,113,0.8)",
              border: isActive ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(239,68,68,0.18)",
              boxShadow: isActive ? "0 4px 16px rgba(239,68,68,0.12)" : "none",
            })}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              e.currentTarget.style.transform = "translateX(4px)";
              e.currentTarget.style.color = "#fca5a5";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.06)";
              e.currentTarget.style.transform = "translateX(0)";
              e.currentTarget.style.color = "rgba(248,113,113,0.8)";
            }}>
            <ShieldCheck size={16} />
            Boshqaruv
          </NavLink>
        )}

      </nav>

      {/* Support button */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="https://t.me/haniyf_dev" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: "14px", textDecoration: "none", transition: "all 0.2s", cursor: "pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.18)"; }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
            <img src="/icons/admin.png" alt="support" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>Support</p>
            <p style={{ fontSize: "11px", color: "rgba(165,180,252,0.6)", marginTop: "1px" }}>@haniyf_dev</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: "auto" }}>
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#070712", display: "flex", color: "white" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40 }} />
      )}

      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ display: "none" }}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div style={{
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
      }}>
        <SidebarContent />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Navbar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(7,7,18,0.9)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: "60px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button onClick={() => setSidebarOpen(true)} className="hamburger-btn"
              style={{ display: "none", width: "36px", height: "36px", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
              <Menu size={18} />
            </button>
            <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <div style={{ width: "61px", height: "61px", borderRadius: "14px", overflow: "hidden", flexShrink: 0 }}>
                <img src="/icons/chontak.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: "15px", color: "white" }}>Cho'ntak</span>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
              <Bell size={16} />
            </button>

            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px 6px 6px", background: dropdownOpen ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${dropdownOpen ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" }}>
                <UserAvatar user={user} size={28} radius={8} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "white", whiteSpace: "nowrap" }}>
                  {user?.full_name?.split(" ")[0]}
                </span>
                <ChevronDown size={14} color="rgba(255,255,255,0.4)"
                  style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  width: "220px", background: "#0D0D22",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100,
                }}>
                  <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <UserAvatar user={user} size={36} radius={10} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.full_name}</p>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{user?.phone_number}</p>
                      </div>
                    </div>
                    {isPremium && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "8px", padding: "3px 10px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "999px" }}>
                        <Crown size={11} color="#fbbf24" />
                        <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 600 }}>{isAdmin ? "Admin" : "Premium"}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "8px" }}>
                    <button onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: 500, textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <User size={15} /> Profil sozlamalari
                    </button>
                    {isAdmin && (
                      <button onClick={() => { setDropdownOpen(false); setBoshqaruvOpen(true); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "rgba(248,113,113,0.8)", fontSize: "13px", fontWeight: 500, textAlign: "left" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <ShieldCheck size={15} /> Boshqaruv
                      </button>
                    )}
                    <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                    <button onClick={handleLogout}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: "13px", fontWeight: 600, textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <LogOut size={15} /> Chiqish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px 40px", width: "100%", boxSizing: "border-box" }}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer style={{
          background: "linear-gradient(180deg, #07071a 0%, #050510 100%)",
          borderTop: "1px solid rgba(139,92,246,0.3)",
          flexShrink: 0,
        }}>
          {/* Asosiy qator */}
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>

            {/* Chap: brend + shior */}
            <div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "white", marginBottom: "4px", letterSpacing: "-0.01em" }}>Cho'ntak</p>
              <p style={{ fontSize: "12px", color: "rgba(167,139,250,0.55)" }}>Sizning ishonchli raqamli hamyoningiz</p>
            </div>

            {/* O'rta: social label + links */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(167,139,250,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Ijtimoiy tarmoqlar</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {[
                  { href: "https://t.me/chontak_uz", title: "Telegram", color: "#60a5fa", svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.48 14.13l-2.95-.924c-.641-.204-.654-.641.136-.953l11.527-4.445c.535-.194 1.002.131.37.44z"/></svg> },
                  { href: "https://instagram.com/chontak_uz", title: "Instagram", color: "#f472b6", svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                  { href: "https://facebook.com/chontak_uz", title: "Facebook", color: "#818cf8", svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg> },
                  { href: "https://youtube.com/@chontak_uz", title: "YouTube", color: "#f87171", svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
                ].map(({ href, title, color, svg }) => (
                  <a key={title} href={href} target="_blank" rel="noopener noreferrer" title={title}
                    style={{ width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "11px", color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "all 0.2s", flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.borderColor = `${color}44`; e.currentTarget.style.color = color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                    {svg}
                  </a>
                ))}
              </div>
            </div>

            {/* O'ng: telefon + copyright */}
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "15px", fontWeight: 800, color: "#e2e8f0", marginBottom: "4px" }}>+998 90 123 45 67</p>
              <p style={{ fontSize: "12px", color: "rgba(167,139,250,0.55)" }}>© 2026 Cho'ntak</p>
            </div>

          </div>

          {/* Pastki chiziq */}
          <div style={{ borderTop: "1px solid rgba(139,92,246,0.12)", padding: "10px 32px", maxWidth: "1200px", margin: "0 auto" }}>
            <p style={{ fontSize: "11px", color: "rgba(167,139,250,0.3)", textAlign: "center" }}>
              Barcha huquqlar himoyalangan · Cho'ntak raqamli to'lov tizimi
            </p>
          </div>
        </footer>

      </div>



      <style>{`
        .desktop-sidebar { display: flex !important; }
        .hamburger-btn { display: none !important; }
        .mobile-close { display: none !important; }
        @media (max-width: 1024px) {
          .desktop-sidebar { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .mobile-close { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
