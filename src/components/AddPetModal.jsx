import React, { useState, useEffect } from "react";
import { addPet, updatePet } from "../lib/firebaseMutations";
import { useAuth } from "../contexts/AuthContext";
import { X, PawPrint, User, Calendar, Weight, ImageIcon, FileText } from 'lucide-react';

export default function AddPetModal({ open, onClose, onSuccess, initialData = null, petId = null }) {
  const isEditMode = Boolean(petId && initialData);
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
      if (isEditMode) {
        await updatePet(currentUser.uid, petId, payload);
      } else {
        await addPet(currentUser.uid, payload);
      }
      
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
      
      // Call success callback if provided, otherwise just close
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose && onClose();
        }
      }, 300);
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'add'} pet:`, err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'add'} pet. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              transform: translateY(20px) scale(0.95);
              opacity: 0;
            }
            to { 
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          /* Hide scrollbar for webkit browsers */
          form::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
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
        borderRadius: "16px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
        width: "100%",
        maxWidth: "580px",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 12px rgba(129, 140, 248, 0.25)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(255, 255, 255, 0.3)"
            }}>
              <PawPrint size={22} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 style={{
                fontSize: "1.375rem",
                fontWeight: "700",
                color: "white",
                margin: 0,
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}>
                {isEditMode ? 'Edit Pet' : 'Add Pet'}
              </h3>
              <p style={{
                fontSize: "0.8125rem",
                color: "rgba(255, 255, 255, 0.9)",
                margin: "2px 0 0 0",
                fontWeight: 500
              }}>
                {isEditMode ? 'Update information' : 'Add your pet\'s information'}
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSubmitting && onClose && onClose()}
            disabled={isSubmitting}
            style={{
              width: "36px",
              height: "36px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "8px",
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
            <X size={18} color="white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '16px 24px 0',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #f87171',
            borderRadius: '10px',
            color: '#991b1b',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <X size={12} color="white" strokeWidth={3} />
            </div>
            {error}
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{
          padding: "20px 24px",
          overflowY: "auto",
          flex: 1,
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}>
          {/* Basic Information Section */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <PawPrint size={18} color="#818cf8" strokeWidth={2.5} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#374151' }}>
                Basic Information
              </h4>
            </div>

            {/* Name and Species Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "6px"
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
                    padding: "10px 12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "0.9375rem",
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
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "6px"
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
                    padding: "10px 12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "0.9375rem",
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "6px"
                }}>
                  Breed
                </label>
                <input
                  name="breed"
                  placeholder="e.g., Labrador"
                  value={form.breed}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "0.9375rem",
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
                  gap: "5px",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "6px"
                }}>
                  <Calendar size={14} color="#818cf8" />
                  Date of Birth
                </label>
                <input
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "0.9375rem",
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "6px"
                }}>
                  <User size={14} color="#818cf8" />
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "0.9375rem",
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
                  gap: "5px",
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "#4b5563",
                  marginBottom: "6px"
                }}>
                  <Weight size={14} color="#818cf8" />
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
                    padding: "10px 12px",
                    border: "2px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "0.9375rem",
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
              gap: '8px', 
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <ImageIcon size={18} color="#818cf8" strokeWidth={2.5} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#374151' }}>
                Additional Information
              </h4>
            </div>

            {/* Avatar URL */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#4b5563",
                marginBottom: "6px"
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
                  padding: "10px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "0.9375rem",
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
                gap: "5px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                color: "#4b5563",
                marginBottom: "6px"
              }}>
                <FileText size={14} color="#818cf8" />
                Notes
              </label>
              <textarea
                name="notes"
                placeholder="Any special notes..."
                value={form.notes}
                onChange={handleChange}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "0.9375rem",
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
          padding: "16px 24px",
          borderTop: "2px solid #f3f4f6",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          background: "#fafafa"
        }}>
          <button
            type="button"
            onClick={() => !isSubmitting && onClose && onClose()}
            disabled={isSubmitting}
            style={{
              padding: "11px 24px",
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
              padding: "11px 28px",
              background: isSubmitting ? "#9ca3af" : "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.9375rem",
              fontWeight: "700",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isSubmitting ? "none" : "0 6px 16px rgba(129, 140, 248, 0.35)"
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(129, 140, 248, 0.45)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(129, 140, 248, 0.35)";
            }}
          >
            {isSubmitting ? (isEditMode ? "Updating..." : "Adding...") : (isEditMode ? "Update Pet" : "Add Pet")}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
