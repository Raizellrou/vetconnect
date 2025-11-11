import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ClinicDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!userData) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1>Welcome Clinic Owner 🏥</h1>
      <p>Clinic: {userData?.clinicName || "Your clinic"}</p>
      <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        Log Out
      </button>
    </div>
  );
}
