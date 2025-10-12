import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./contexts/Authcontext";
import LandingPage from "./pages/LandingPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import ClinicDashboard from "./pages/ClinicDashboard";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

export default function App() {
  const { currentUser, userData } = useAuth();

  // helper component: redirect to role-specific dashboard
  function DashboardRedirect() {
    if (!currentUser) return <Navigate to="/" />;
    // if userData available use it, otherwise show fallback while AuthContext loads data
    if (!userData) return <p>Loading...</p>;
    if (userData.role === "clinicOwner") return <Navigate to="/clinic-dashboard" />;
    return <Navigate to="/owner-dashboard" />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage />}
        />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" />} />

        {/* legacy /dashboard route redirects to role-specific dashboard */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* role-specific dashboards (protected) */}
        <Route
          path="/owner-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <OwnerDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinic-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicDashboard />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

