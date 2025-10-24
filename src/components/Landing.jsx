import React from "react";
import { Link } from "react-router-dom";
import "../styles/Landing.css";

export default function Landing() {
  const conditions = [
    "Skin Allergy",
    "Ear Infection",
    "Arthritis",
    "Diabetes",
    "Obesity",
    "Dental Disease",
  ];

  const services = [
    "Vaccination",
    "Surgery",
    "Dental Care",
    "Microchipping",
    "Grooming",
    "Telemedicine",
  ];

  return (
    <main className="landing-main">
      <section className="landing-hero">
        <div className="hero-content hero-left">
          <h2 className="hero-title">Book your Appointment, whether in-person or online</h2>
          <p className="hero-sub">Find vetted veterinary clinics, book in-person visits or consult online with certified veterinarians.</p>

          <div className="search-wrap">
            <input
              className="search-input"
              aria-label="Search clinics, services or conditions"
              placeholder="Search clinics, services or conditions"
            />
          </div>

          <div className="consult-card" role="region" aria-label="Vet consultations">
            <div className="consult-left">
              <div className="kicker">VET CONSULTATIONS</div>
              <h3 className="consult-title">Looking for pet advice from veterinarians?</h3>
              <p className="muted">Book your Appointments now</p>
              <Link to="/register" className="btn btn-primary consult-btn">Consult now</Link>
            </div>
            <div className="consult-illus" aria-hidden="true" />
          </div>

        </div>

        <aside className="hero-illustration" aria-hidden="true" />
      </section>

      <section className="purple-banner">
        <h2>“We’re bridging the gap between Veterinarians and Pet Owners”</h2>
        <p className="banner-sub">You’ll never miss another Clinic appointment!</p>
      </section>

      <section className="listing-section">
        <div className="section-head">
          <div>
            <h3>Common Conditions</h3>
            <p className="muted">Easily access veterinarians treating these conditions</p>
          </div>
          <Link to="/conditions" className="btn btn-secondary small">VIEW ALL</Link>
        </div>

        <div className="card-grid">
          {conditions.map((c, i) => (
            <Link to={`/conditions/${c.toLowerCase().replace(/\s+/g, "-")}`} key={i} className="card">
              <div className="card-placeholder" />
              <div className="card-title">{c}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="listing-section">
        <div className="section-head">
          <div>
            <h3>Common Services</h3>
            <p className="muted">Easily access veterinarians offering these services</p>
          </div>
          <Link to="/services" className="btn btn-secondary small">VIEW ALL</Link>
        </div>

        <div className="card-grid">
          {services.map((s, i) => (
            <Link to={`/services/${s.toLowerCase().replace(/\s+/g, "-")}`} key={i} className="card">
              <div className="card-placeholder" />
              <div className="card-title">{s}</div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}