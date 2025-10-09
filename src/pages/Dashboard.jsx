import { useAuth } from "../contexts/Authcontext";

export default function Dashboard() {
  const { userData, logout } = useAuth();

  if (!userData) return <p>Loading...</p>;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="p-4">
      <h1>Welcome {userData.role === "clinicOwner" ? "Clinic Owner 🏥" : "Pet Owner 🐾"}</h1>
      <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        Log Out
      </button>
    </div>
  );
}
