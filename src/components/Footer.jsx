import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";
import fb from "../assets/facebook.png";
import tw from "../assets/twitter.png";
import ig from "../assets/instagram.png";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="vc-footer">
      <div className="vc-footer-inner">
        <div className="vc-footer-left">
          <div className="vc-copy">VetConnect © {year}</div>
          <div className="vc-quick-links">
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
        <div className="vc-footer-right">
          <div className="vc-socials">
            <img src={fb} alt="facebook" className="vc-social" />
            <img src={tw} alt="twitter" className="vc-social" />
            <img src={ig} alt="instagram" className="vc-social" />
          </div>
        </div>
      </div>
    </footer>
  );
}
