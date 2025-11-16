import React from "react";
import { Link } from "react-router-dom";
import { 
  Heart, 
  Ear, 
  Bone, 
  Droplet, 
  Scale, 
  Smile, 
  Syringe, 
  Scissors, 
  Stethoscope, 
  Cpu, 
  Sparkles, 
  Video 
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import heroVetImg from "../assets/hero-vet.jpg";
import "../styles/Landing.css";

export default function LandingPage() {
  const conditions = [
    { 
      name: "Skin Allergy", 
      icon: Heart,
      description: "Itchy or inflamed skin caused by allergens like food, fleas, or the environment."
    },
    { 
      name: "Ear Infection", 
      icon: Ear,
      description: "A painful inflammation of the ear canal often caused by bacteria, yeast, or mites."
    },
    { 
      name: "Arthritis", 
      icon: Bone,
      description: "Joint inflammation that causes pain, stiffness, and reduced mobility in pets."
    },
    { 
      name: "Diabetes", 
      icon: Droplet,
      description: "A condition where the body cannot regulate blood sugar properly."
    },
    { 
      name: "Obesity", 
      icon: Scale,
      description: "Excess body weight that can lead to serious health problems in pets."
    },
    { 
      name: "Dental Disease", 
      icon: Smile,
      description: "Infection or decay affecting a pet's teeth and gums."
    },
  ];

  const services = [
    { 
      name: "Vaccination", 
      icon: Syringe,
      description: "Protects pets from common diseases through preventive shots."
    },
    { 
      name: "Surgery", 
      icon: Scissors,
      description: "Medical procedures performed to treat injuries or health conditions."
    },
    { 
      name: "Dental Care", 
      icon: Stethoscope,
      description: "Cleaning and treatment to maintain healthy teeth and gums."
    },
    { 
      name: "Microchipping", 
      icon: Cpu,
      description: "A permanent ID implant that helps locate pets when lost."
    },
    { 
      name: "Grooming", 
      icon: Sparkles,
      description: "Bathing, trimming, and cleaning to keep pets hygienic and comfortable."
    },
    { 
      name: "Telemedicine", 
      icon: Video,
      description: "Virtual veterinary consultations done through online communication."
    },
  ];

  return (
    <>
      <Header />
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
                <h3>Looking for pet advice from veterinarians?</h3>
                <p className="muted">Book your Appointments now</p>
                <Link to="/register" className="btn btn-primary consult-btn">Consult now</Link>
              </div>
              <div className="consult-illus" aria-hidden="true" />
            </div>
          </div>
          <aside className="hero-illustration" aria-hidden="true">
            <img src={heroVetImg} alt="Veterinarian with pet" className="hero-image" />
          </aside>
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
          </div>
          <div className="card-grid">
            {conditions.map((c, i) => {
              const IconComponent = c.icon;
              return (
                <Link to={`/conditions/${c.name.toLowerCase().replace(/\s+/g, "-")}`} key={i} className="card">
                  <div className="card-icon">
                    <IconComponent size={32} strokeWidth={1.5} />
                  </div>
                  <div className="card-title">{c.name}</div>
                  <div className="card-tooltip">{c.description}</div>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="listing-section">
          <div className="section-head">
            <div>
              <h3>Common Services</h3>
              <p className="muted">Easily access veterinarians offering these services</p>
            </div>
          </div>
          <div className="card-grid">
            {services.map((s, i) => {
              const IconComponent = s.icon;
              return (
                <Link to={`/services/${s.name.toLowerCase().replace(/\s+/g, "-")}`} key={i} className="card">
                  <div className="card-icon">
                    <IconComponent size={32} strokeWidth={1.5} />
                  </div>
                  <div className="card-title">{s.name}</div>
                  <div className="card-tooltip">{s.description}</div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      {/* Footer matching reference image */}
      <div className="vc-footer">
        <div className="vc-footer-inner">
          <div>
            <div>For Pet Owners</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <Link to="/clinics">Find Clinic</Link>
              <Link to="/conditions">Conditions</Link>
              <Link to="/services">Services</Link>
            </div>
          </div>
          <div>
            <div>For Veterinarians / Clinics</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <Link to="/support">Support Center</Link>
            </div>
          </div>
          <div>
            <div>General</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <Link to="/about">About us</Link>
              <Link to="/terms">Terms & Conditions</Link>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
          <div>
            <div>Social Media</div>
            <div style={{display: 'flex', gap: '14px', alignItems: 'center'}}>
              <a href="#" aria-label="Facebook"><img src="/src/assets/facebook.png" alt="Facebook" className="vc-social" /></a>
              <a href="#" aria-label="Twitter"><img src="/src/assets/twitter.png" alt="Twitter" className="vc-social" /></a>
              <a href="#" aria-label="Instagram"><img src="/src/assets/instagram.png" alt="Instagram" className="vc-social" /></a>
              <a href="#" aria-label="YouTube"><img src="/src/assets/youtube.png" alt="YouTube" className="vc-social" /></a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

