import React, { useState, useEffect } from "react";
import { addPet } from "../lib/firebaseMutations";
import { useAuth } from "../contexts/AuthContext";

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

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      console.error("No authenticated user");
      return;
    }

    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed,
      dob: form.dob ? new Date(form.dob) : null,
      gender: form.gender,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      notes: form.notes,
      avatarURL: form.avatarURL
      // createdAt/updatedAt added by addPet in firebaseMutations
    };

    try {
      await addPet(currentUser.uid, payload);
      // reset form (optional)
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
      onClose && onClose();
    } catch (err) {
      console.error("Failed to add pet:", err);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.4)",
      zIndex: 60
    }}>
      <div style={{ width: 520, background: "white", borderRadius: 8, padding: 20 }}>
        <h3 style={{ margin: "0 0 12px 0" }}>Add Pet</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input name="name" required placeholder="Name" value={form.name} onChange={handleChange} className="border p-2 rounded w-full" />
          <input name="species" required placeholder="Species" value={form.species} onChange={handleChange} className="border p-2 rounded w-full" />
          <input name="breed" placeholder="Breed" value={form.breed} onChange={handleChange} className="border p-2 rounded w-full" />
          <input name="dob" type="date" value={form.dob} onChange={handleChange} className="border p-2 rounded w-full" />
          <select name="gender" value={form.gender} onChange={handleChange} className="border p-2 rounded w-full">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input name="weightKg" type="number" step="0.1" placeholder="Weight (kg)" value={form.weightKg} onChange={handleChange} className="border p-2 rounded w-full" />
          <input name="avatarURL" placeholder="Avatar URL (optional)" value={form.avatarURL} onChange={handleChange} className="border p-2 rounded w-full" />
          <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} className="border p-2 rounded w-full" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={() => onClose && onClose()} className="px-4 py-2 rounded bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Add Pet</button>
          </div>
        </form>
      </div>
    </div>
  );
}