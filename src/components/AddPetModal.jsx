import React, { useState, useEffect } from "react";
import { addPet } from "../lib/firebaseMutations";
import { useAuth } from "../contexts/AuthContext";
import { X, PawPrint, User, Calendar, Weight, ImageIcon, FileText } from 'lucide-react';

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
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      animation: "fadeIn 0.2s ease-out"
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget && !isSubmitting) onClose && onClose();
    }}
    >
      <div style={{
        backgroundColor: "white",
        borderRadius: "24px",
        boxShadow: "0 25px 70px rgba(0, 0, 0, 0.35)",
        width: "100%",
        maxWidth: "720px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
          padding: "32px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 20px rgba(129, 140, 248, 0.3)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(255, 255, 255, 0.3)"
            }}>
              <PawPrint size={28} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "white",
                margin: 0,
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}>
                Add Pet
              </h3>
              <p style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.95)",
                margin: "4px 0 0 0",
                fontWeight: 500
              }}>
                Add your furry friend's information
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSubmitting && onClose && onClose()}
            disabled={isSubmitting}
            style={{
              width: "40px",
              height: "40px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "10px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isSubmitting ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
          >
            <X size={20} color="white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '24px 40px 0',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #f87171',
            borderRadius: '12px',
            color: '#991b1b',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <X size={14} color="white" strokeWidth={3} />
            </div>
            {error}
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{
          padding: "32px 40px",
          overflowY: "auto",
          flex: 1
        }}>
          {/* Basic Information Section */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <PawPrint size={20} color="#818cf8" strokeWidth={2.5} />
              <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#374151' }}>
                Basic Information
              </h4>
            </div>

            {/* Name and Species Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#4b5563",
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
                    padding: "14px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#818cf8";
                    e.target.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
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
                  color: "#4b5563",
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
                    padding: "14px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#818cf8";
                    e.target.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Breed and Date of Birth Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#4b5563",
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
                    padding: "14px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#818cf8";
                    e.target.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "8px"
                }}>
                  <Calendar size={16} color="#818cf8" />
                  Date of Birth
                </label>
                <input
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#818cf8";
                    e.target.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "8px"
                }}>
                  <User size={16} color="#818cf8" />
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    backgroundColor: "white"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#818cf8";
                    e.target.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "8px"
                }}>
                  <Weight size={16} color="#818cf8" />
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
                    padding: "14px 16px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#818cf8";
                    e.target.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <ImageIcon size={20} color="#818cf8" strokeWidth={2.5} />
              <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#374151' }}>
                Additional Information
              </h4>
            </div>

            {/* Avatar URL */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#4b5563",
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
                  padding: "14px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#818cf8";
                  e.target.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
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
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#4b5563",
                marginBottom: "8px"
              }}>
                <FileText size={16} color="#818cf8" />
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
                  padding: "14px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.2s",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#818cf8";
                  e.target.style.boxShadow = "0 0 0 3px rgba(129, 140, 248, 0.1)";
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
          padding: "24px 40px",
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
              padding: "14px 32px",
              background: "white",
              color: "#374151",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isSubmitting ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: "14px 36px",
              background: isSubmitting ? "#9ca3af" : "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: "700",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isSubmitting ? "none" : "0 8px 20px rgba(129, 140, 248, 0.4)"
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(129, 140, 248, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(129, 140, 248, 0.4)";
            }}
          >
            {isSubmitting ? "Adding..." : "Add Pet"}
          </button>
        </div>
      </div>
    </div>
  );
}
