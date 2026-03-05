import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import useAuthStore from "../store/authStore";
import {
  LayoutDashboard, ArrowLeftRight, Send, CreditCard,
  BookmarkCheck, Crown, User, LogOut, Menu, X, Wallet, Bell, ChevronDown
} from "lucide-react";

const BASE_URL = "http://localhost:8000";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Tranzaksiyalar" },
  { to: "/send", icon: Send, label: "Pul yuborish" },
  { to: "/cards", icon: CreditCard, label: "Kartalarim" },
  { to: "/saved-cards", icon: BookmarkCheck, label: "Saqlangan" },
  { to: "/subscription", icon: Crown, label: "Premium" },
  { to: "/profile", icon: User, label: "Profil" },
];

function UserAvatar({ user, size = 32, radius = 10 }) {
  const avatarUrl = user?.avatar?.photo_url ? `${BASE_URL}${user.avatar.photo_url}` : null;
  const initials = user?.full_name?.[0]?.toUpperCase() || "U";
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: `${radius}px`, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${Math.round(size * 0.4)}px`, fontWeight: 700, flexShrink: 0, overflow: "hidden", color: "white" }}>
      {avatarUrl
        ? <img src={avatarUrl} alt="av" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
        : initials}
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const isPremium = user?.role === "PREMIUM" || user?.role === "ADMIN";

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
    <div style={{ width: "240px", height: "100%", background: "#0D0D22", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
            <Wallet size={17} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "17px", color: "white" }}>Cho'ntak</span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="mobile-close" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex" }}>
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
              fontSize: "14px", fontWeight: 500, transition: "all 0.15s",
              background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
              color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.45)",
              border: isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
            })}>
            <Icon size={16} />
            {label}
            {label === "Premium" && !isPremium && (
              <span style={{ marginLeft: "auto", fontSize: "10px", padding: "2px 7px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "999px", color: "#fbbf24", fontWeight: 600 }}>NEW</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "12px" }}>
          <UserAvatar user={user} size={32} radius={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.full_name || "Foydalanuvchi"}</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.phone_number}</p>
          </div>
          {isPremium && <Crown size={13} color="#fbbf24" />}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#070712", display: "flex", color: "white" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40 }} />
      )}

      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{ display: "none" }}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s ease" }}>
        <SidebarContent />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Navbar */}
        <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(7,7,18,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "60px", flexShrink: 0 }}>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button onClick={() => setSidebarOpen(true)} className="hamburger-btn" style={{ display: "none", width: "36px", height: "36px", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
              <Menu size={18} />
            </button>
            <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={13} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: "15px", color: "white" }}>Cho'ntak</span>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
              <Bell size={16} />
            </button>

            {/* Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px 6px 6px", background: dropdownOpen ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${dropdownOpen ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" }}
              >
                <UserAvatar user={user} size={28} radius={8} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "white", whiteSpace: "nowrap" }}>
                  {user?.full_name?.split(" ")[0]}
                </span>
                <ChevronDown size={14} color="rgba(255,255,255,0.4)" style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
              </button>

              {dropdownOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "220px", background: "#0D0D22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 100 }}>
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
                        <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 600 }}>Premium</span>
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

        <main style={{ flex: 1, padding: "24px", maxWidth: "1200px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          <Outlet />
        </main>
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