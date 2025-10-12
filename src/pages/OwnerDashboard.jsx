import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/Authcontext";

export default function OwnerDashboard() {
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
      <h1>Welcome Pet Owner 🐾</h1>
      <p>Hello, {userData.email}</p>
      <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        Log Out
      </button>
    </div>
  );
}
