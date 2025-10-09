import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import logo from "../assets/logo.png";

export default function Header() {
  const [open, setOpen] = useState(false);

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
      </div>
    </header>
  );
}
