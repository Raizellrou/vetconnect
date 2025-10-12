import React, { useState, useRef, useEffect } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";
import eye from "../assets/eyeOn.png";
import eyeOff from "../assets/eyeOff.png";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 1500);
  };

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user?.uid;
      // fetch role from Firestore
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

      showSuccess("Welcome back 🐾");

      // navigate based on role
      if (role === "clinicOwner") {
        setTimeout(() => navigate("/clinic-dashboard"), 900);
      } else {
        // default to pet owner dashboard
        setTimeout(() => navigate("/owner-dashboard"), 900);
      }
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
      <div className="auth-container">
        {successMessage && <div className="local-toast">{successMessage}</div>}
        <h1 className="auth-title">Login</h1>

        <form onSubmit={handleLogin} className="auth-form">
          <input
            ref={emailRef}
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div className="auth-input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="auth-input auth-input-inside"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        <div className="auth-divider"><span>or</span></div>

        <button className="auth-button google" onClick={handleGoogle} disabled={loadingGoogle}>
          {loadingGoogle ? "Loading..." : "Sign in with Google"}
        </button>

        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}