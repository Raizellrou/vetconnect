import React, { useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";
import eye from "../assets/eyeOn.png";
import eyeOff from "../assets/eyeOff.png";

const mapAuthError = (code, fallback) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    default:
      return fallback || "An error occurred. Please try again.";
  }
};

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("petOwner");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const passwordsMatch = password !== "" && password === confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        role,
        createdAt: new Date(),
      });
      showSuccess("Welcome 🐾");
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      console.error("Register error:", err);
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
      if (result?.user?.uid) {
        // Create user doc for new sign-ups (guarded by isNewUser may not always be present)
        try {
          await setDoc(doc(db, "users", result.user.uid), {
            email: result.user.email,
            role,
            createdAt: new Date(),
          });
        } catch (e) {
          // if doc write fails, still proceed to dashboard
          console.warn("Could not write user doc:", e);
        }
      }
      showSuccess("Welcome 🐾");
      setTimeout(() => navigate("/dashboard"), 900);
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
        <h1 className="auth-title">Register</h1>

        <form onSubmit={handleRegister} className="auth-form">
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
              autoComplete="new-password"
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

          <div className="auth-input-with-icon">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              className="auth-input auth-input-inside"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <img
              src={showConfirm ? eyeOff : eye}
              alt={showConfirm ? "Hide confirm password" : "Show confirm password"}
              className="toggle-icon"
              role="button"
              tabIndex={0}
              onClick={() => setShowConfirm((s) => !s)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setShowConfirm((s) => !s);
              }}
            />
          </div>

          <div className="confirm-row">
            {confirmPassword.length > 0 ? (
              passwordsMatch ? (
                <span className="match success">✅ Passwords match</span>
              ) : (
                <span className="match error">❌ Passwords do not match</span>
              )
            ) : (
              <span className="match muted">Enter passwords to compare</span>
            )}
          </div>

          <div className="auth-select-group">
            <label className="select-label">Select Role:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="auth-select">
              <option value="petOwner">🐾 Pet Owner</option>
              <option value="clinicOwner">🏥 Clinic Owner</option>
            </select>
          </div>

          <button type="submit" className="auth-button primary" disabled={!passwordsMatch || loading}>
            {loading ? "Loading..." : "Register"}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}

        <div className="auth-divider"><span>or</span></div>

        <button className="auth-button google" onClick={handleGoogle} disabled={loadingGoogle}>
          {loadingGoogle ? "Loading..." : "Sign up with Google"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}