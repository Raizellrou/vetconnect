import React, { useState, useEffect } from "react";

export default function PetForm({ onSubmit, editingPet, setEditingPet }) {
  const [form, setForm] = useState({
    pet_name: "",
    species: "",
    breed: "",
    age: "",
    gender: "",
  });

  useEffect(() => {
    if (editingPet) setForm(editingPet);
  }, [editingPet]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ pet_name: "", species: "", breed: "", age: "", gender: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder="Pet Name"
        value={form.pet_name}
        onChange={(e) => setForm({ ...form, pet_name: e.target.value })}
        className="border p-2 rounded w-full"
        required
      />
      <input
        type="text"
        placeholder="Species"
        value={form.species}
        onChange={(e) => setForm({ ...form, species: e.target.value })}
        className="border p-2 rounded w-full"
        required
      />
      <input
        type="text"
        placeholder="Breed"
        value={form.breed}
        onChange={(e) => setForm({ ...form, breed: e.target.value })}
        className="border p-2 rounded w-full"
      />
      <input
        type="number"
        placeholder="Age"
        value={form.age}
        onChange={(e) => setForm({ ...form, age: e.target.value })}
        className="border p-2 rounded w-full"
      />
      <select
        value={form.gender}
        onChange={(e) => setForm({ ...form, gender: e.target.value })}
        className="border p-2 rounded w-full"
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>

      <button
        type="submit"
        className={`px-4 py-2 rounded text-white ${
          editingPet ? "bg-blue-500" : "bg-green-500"
        }`}
      >
        {editingPet ? "Update Pet" : "Add Pet"}
      </button>

      {editingPet && (
        <button
          type="button"
          onClick={() => setEditingPet(null)}
          className="ml-2 bg-gray-400 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
