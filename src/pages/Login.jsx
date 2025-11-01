import React, { useState, useRef, useEffect } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";
import eye from "../assets/eyeOn.png";
import eyeOff from "../assets/eyeOff.png";
import logo from "../assets/logo.png";

const mapAuthError = (code, fallback) => {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password. Try again.";
    default:
      return fallback || "An error occurred. Please try again.";
  }
};

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const emailRef = useRef(null);
  const navigate = useNavigate();

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const uid = userCred.user?.uid;
      let role = null;

      if (uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            role = userDoc.data().role;
          }
        } catch (err) {
          console.warn("Could not fetch user doc:", err);
        }
      }

      showSuccess("Welcome back to VetConnect! 🐾");

      const redirectDelay = 1000;
      setTimeout(() => {
        if (role === "clinicOwner" || role === "clinicStaff") {
          navigate("/clinic-dashboard");
        } else {
          navigate("/owner-dashboard");
        }
      }, redirectDelay);
    } catch (err) {
      console.error("Login error:", err);
      setError(mapAuthError(err.code, err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const uid = result?.user?.uid;

      // attempt to read role from Firestore if exists
      let role = null;
      if (uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            role = userDoc.data().role;
          }
        } catch (e) {
          console.warn("Could not read user doc:", e);
        }
      }

      showSuccess("Welcome back 🐾");
      if (role === "clinicOwner") {
        setTimeout(() => navigate("/clinic-dashboard"), 900);
      } else {
        setTimeout(() => navigate("/owner-dashboard"), 900);
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(mapAuthError(err.code, err.message));
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container login">
        {successMessage && <div className="local-toast">{successMessage}</div>}
        
        <div className="logo-container">
         <img src={logo} alt="VetConnect Logo" className="auth-logo" />
          <h2>VETCONNECT</h2>
          <p className="subtitle">Welcome back! Please login to continue.</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <input
              ref={emailRef}
              type="email"
              name="email"
              placeholder="EMAIL"
              className="auth-input"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <div className="auth-input-with-icon">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="PASSWORD"
                className="auth-input auth-input-inside"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="current-password"
              />
              <img
                src={showPassword ? eyeOff : eye}
                alt={showPassword ? "Hide password" : "Show password"}
                className="toggle-icon"
                role="button"
                tabIndex={0}
                onClick={() => setShowPassword((s) => !s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setShowPassword((s) => !s);
                }}
              />
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button 
            type="submit" 
            className={`auth-button primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? "Loading..." : "LOGIN"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className={`auth-button google ${loadingGoogle ? 'loading' : ''}`}
          onClick={handleGoogle}
          disabled={loadingGoogle}
        >
          {!loadingGoogle && (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
          )}
          {loadingGoogle ? "Loading..." : "Continue with Google"}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
