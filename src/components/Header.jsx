import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import logo from "../assets/logo.png";

export default function Header({ username }) {
  const [open, setOpen] = useState(false);

  const computeInitials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = computeInitials(username);

  return (
    <header className="vc-header">
      <div className="vc-header-inner">
        <div className="vc-brand">
          <img src={logo} alt="VetConnect logo" className="vc-logo" />
          <span className="vc-name">VetConnect</span>
        </div>

        <button
          className="vc-nav-toggle"
          aria-label="Toggle navigation"
          onClick={() => setOpen((s) => !s)}
        >
          <span className={`vc-hamburger ${open ? "open" : ""}`} />
        </button>

        <nav className={`vc-nav ${open ? "open" : ""}`}>
          <Link to="/login" className="vc-link vc-link-plain" onClick={() => setOpen(false)}>
            Login
          </Link>
          <Link to="/register" className="vc-link vc-link-cta" onClick={() => setOpen(false)}>
            Register
          </Link>
        </nav>

        {/* only render user section when username is provided (no landing impact) */}
        {username && (
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <button className="vc-notification" aria-label="Notifications">🔔</button>
            <div className="vc-avatar" title={username} style={{background: '#818cf8', color: '#fff', borderRadius: 8, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700}}>
              {initials}
            </div>
            <div style={{fontWeight:500}}>{username}</div>
          </div>
        )}
      </div>
    </header>
  );
}
