import React, { useState, useEffect } from "react";
import { addPet } from "../lib/firebaseMutations";
import { useAuth } from "../contexts/AuthContext";
import { X, PawPrint, User, Ruler, Calendar, Weight } from 'lucide-react';

export default function AddPetModal({ open, onClose, initialData = null }) {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    dob: "",
    gender: "",
    weightKg: "",
    notes: "",
    avatarURL: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        species: initialData.species || "",
        breed: initialData.breed || "",
        dob: initialData.dob ? (initialData.dob.toDate ? initialData.dob.toDate().toISOString().slice(0,10) : initialData.dob) : "",
        gender: initialData.gender || "",
        weightKg: initialData.weightKg ?? "",
        notes: initialData.notes || "",
        avatarURL: initialData.avatarURL || ""
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("No authenticated user");
      return;
    }

    if (!form.name.trim()) {
      setError("Pet name is required");
      return;
    }

    if (!form.species.trim()) {
      setError("Species is required");
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed,
      dob: form.dob ? new Date(form.dob) : null,
      gender: form.gender,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      notes: form.notes,
      avatarURL: form.avatarURL
    };

    try {
      await addPet(currentUser.uid, payload);
      
      // Reset form
      setForm({
        name: "",
        species: "",
        breed: "",
        dob: "",
        gender: "",
        weightKg: "",
        notes: "",
        avatarURL: ""
      });
      
      // Show success briefly before closing
      setTimeout(() => {
        onClose && onClose();
      }, 300);
    } catch (err) {
      console.error("Failed to add pet:", err);
      setError(err.message || "Failed to add pet. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget && !isSubmitting) onClose && onClose();
    }}
    >
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        width: "100%",
        maxWidth: "600px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "slideIn 0.3s ease"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 12px rgba(236, 72, 153, 0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <PawPrint size={24} color="white" />
            </div>
            <div>
              <h3 style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "white",
                margin: 0
              }}>
                Add Pet
              </h3>
              <p style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.9)",
                margin: 0
              }}>
                Add your furry friend's information
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose && onClose()}
            style={{
              padding: "8px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
          >
            <X size={24} color="white" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '20px 24px 0',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #f87171',
            borderRadius: '10px',
            color: '#991b1b',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{
          padding: "24px",
          overflowY: "auto",
          flex: 1
        }}>
          <div style={{ display: "grid", gap: "20px" }}>
            {/* Name and Species Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Pet Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g., Max, Bella"
                  value={form.name}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ec4899";
                    e.target.style.boxShadow = "0 0 0 3px rgba(236, 72, 153, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Species <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  name="species"
                  required
                  placeholder="e.g., Dog, Cat"
                  value={form.species}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ec4899";
                    e.target.style.boxShadow = "0 0 0 3px rgba(236, 72, 153, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Breed and Date of Birth Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Breed
                </label>
                <input
                  name="breed"
                  placeholder="e.g., Labrador, Persian"
                  value={form.breed}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ec4899";
                    e.target.style.boxShadow = "0 0 0 3px rgba(236, 72, 153, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  <Calendar size={14} style={{ display: "inline", marginRight: "4px" }} />
                  Date of Birth
                </label>
                <input
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ec4899";
                    e.target.style.boxShadow = "0 0 0 3px rgba(236, 72, 153, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Gender and Weight Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    backgroundColor: "white"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ec4899";
                    e.target.style.boxShadow = "0 0 0 3px rgba(236, 72, 153, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  <Weight size={14} style={{ display: "inline", marginRight: "4px" }} />
                  Weight (kg)
                </label>
                <input
                  name="weightKg"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5.5"
                  value={form.weightKg}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#ec4899";
                    e.target.style.boxShadow = "0 0 0 3px rgba(236, 72, 153, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Avatar URL */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px"
              }}>
                Avatar URL (optional)
              </label>
              <input
                name="avatarURL"
                placeholder="https://example.com/pet-photo.jpg"
                value={form.avatarURL}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#ec4899";
                  e.target.style.boxShadow = "0 0 0 3px rgba(236, 72, 153, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px"
              }}>
                Notes
              </label>
              <textarea
                name="notes"
                placeholder="Any special notes about your pet..."
                value={form.notes}
                onChange={handleChange}
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.2s",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#ec4899";
                  e.target.style.boxShadow = "0 0 0 3px rgba(236, 72, 153, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: "20px 24px",
          borderTop: "2px solid #f3f4f6",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          background: "#fafafa"
        }}>
          <button
            type="button"
            onClick={() => !isSubmitting && onClose && onClose()}
            disabled={isSubmitting}
            style={{
              padding: "12px 24px",
              background: "white",
              color: "#374151",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "0.9375rem",
              fontWeight: "600",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: "12px 32px",
              background: isSubmitting ? "#9ca3af" : "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.9375rem",
              fontWeight: "700",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isSubmitting ? "none" : "0 4px 12px rgba(236, 72, 153, 0.3)"
            }}
          >
            {isSubmitting ? "Adding..." : "Add Pet"}
          </button>
        </div>
      </div>
    </div>
  );
}