import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Landing.css";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="landing-main">
        <section className="landing-hero">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to VetConnect 🐾</h1>
            <p className="hero-sub">
              Find trusted veterinary clinics, book appointments, and manage your pet’s health —
              all in one place.
            </p>
            <div className="landing-buttons">
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/about" className="btn btn-secondary">Learn More</Link>
            </div>
          </div>

          <aside className="hero-illustration" aria-hidden="true" />
        </section>
      </main>
      <Footer />
    </>
  );
}
  
