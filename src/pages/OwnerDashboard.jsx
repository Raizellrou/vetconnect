import React, { useState } from "react";
import { useAuth } from "../contexts/Authcontext";
import { useNavigate } from "react-router-dom";
import PetManagement from "./PetManagement";
import MedicalRecords from "./MedicalRecords";

export default function OwnerDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedPetId, setSelectedPetId] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!userData) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-2">Welcome Pet Owner 🐾</h1>
      <p>Hello, {userData.email}</p>

      <hr className="my-4" />

      {!selectedPetId ? (
        <PetManagement userData={userData} onViewRecords={setSelectedPetId} />
      ) : (
        <MedicalRecords
          userData={userData}
          petId={selectedPetId}
          onBack={() => setSelectedPetId(null)}
        />
      )}

      <button
        onClick={handleLogout}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        Log Out
      </button>
    </div>
  );
}
