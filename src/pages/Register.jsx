import React, { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import eye from "../assets/eyeOn.png";
import eyeOff from "../assets/eyeOff.png";
import logo from "../assets/logo.png";
import googleLogo from "../assets/googleLogo.png";

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

export default function Register() {
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    birthday: "",
    contactNo: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!role) {
      setError("Please select a role (Pet Owner or Clinic Staff)");
      return false;
    }
    if (!formData.fullName || !formData.birthday || !formData.contactNo || 
        !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError("Please accept both Terms & Conditions and Privacy Policy");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: formData.fullName,
        birthday: formData.birthday,
        contactNo: formData.contactNo,
        email: formData.email,
        role: role === "Pet Owner" ? "petOwner" : "clinicOwner",
        createdAt: new Date().toISOString()
      });      navigate(role === "Pet Owner" ? "/owner-dashboard" : "/clinic-dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(mapAuthError(err.code, err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!role) {
      setError("Please select a role (Pet Owner or Clinic Staff) before continuing with Google");
      return;
    }

    setLoadingGoogle(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      await setDoc(doc(db, "users", result.user.uid), {
        fullName: result.user.displayName || "",
        email: result.user.email,
        role: role === "Pet Owner" ? "petOwner" : "clinicOwner",
        createdAt: new Date().toISOString()
      });

      navigate(role === "Pet Owner" ? "/owner-dashboard" : "/clinic-dashboard");
    } catch (err) {
      console.error("Google sign-up error:", err);
      setError(mapAuthError(err.code, err.message));
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container register">
        <div className="logo-container">
          <img src={logo} alt="VetConnect Logo" className="auth-logo" /> 
          <h2>VETCONNECT</h2>
          <p className="subtitle">Please complete the following details to proceed.</p>
        </div>

        <div className="register-as">
          <p>REGISTER AS</p>
          <div className="role-buttons">
            <button
              className={`role-button ${role === "Pet Owner" ? "active" : ""}`}
              onClick={() => setRole("Pet Owner")}
              type="button"
            >
              Pet Owner
            </button>
            <button
              className={`role-button ${role === "Clinic Staff" ? "active" : ""}`}
              onClick={() => setRole("Clinic Staff")}
              type="button"
            >
              Clinic Staff
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            name="fullName"
            placeholder="FULL NAME"
            className="auth-input"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />

          <input
            type="date"
            name="birthday"
            placeholder="BIRTHDAY"
            className="auth-input"
            value={formData.birthday}
            onChange={handleInputChange}
            required
          />

          <input
            type="tel"
            name="contactNo"
            placeholder="CONTACT NO."
            className="auth-input"
            value={formData.contactNo}
            onChange={handleInputChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="EMAIL"
            className="auth-input"
            value={formData.email}
            onChange={handleInputChange}
            required
            autoComplete="email"
          />

          <div className="auth-input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="PASSWORD"
              className="auth-input auth-input-inside"
              value={formData.password}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
            />
            <img
              src={showPassword ? eyeOff : eye}
              alt={showPassword ? "Hide password" : "Show password"}
              className="toggle-icon"
              onClick={() => setShowPassword(prev => !prev)}
            />
          </div>

          <div className="auth-input-with-icon">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="CONFIRM PASSWORD"
              className="auth-input auth-input-inside"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              autoComplete="new-password"
            />
            <img
              src={showConfirmPassword ? eyeOff : eye}
              alt={showConfirmPassword ? "Hide password" : "Show password"}
              className="toggle-icon"
              onClick={() => setShowConfirmPassword(prev => !prev)}
            />
          </div>

          <div className="auth-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>I have read, understood, and accept the <a href="#">Terms and Conditions.</a></span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
              />
              <span>I have read, understood, and accept the <a href="#">Privacy and Policy.</a></span>
            </label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? "Loading..." : "SUBMIT"}
          </button>

          <div className="auth-divider"><span>or</span></div>

          <button
            type="button"
            className="auth-button google"
            onClick={handleGoogle}
            disabled={loadingGoogle}
          >
                <img src={googleLogo} alt="Google Logo" className="google-icon" /> {/* 💡 ADDED GOOGLE ICON */}
            {loadingGoogle ? "Loading..." : "Continue with Google"}
          </button>
        </form>
      </div>
    </div>
  );
}
