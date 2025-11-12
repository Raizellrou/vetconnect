import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
// OwnerDashboard lives under the PetOwnerDashBoard folder
import OwnerDashboard from "./pages/PetOwnerDashBoard/OwnerDashboard";
import ClinicOwnerDashboard from "./pages/ClinicOwner/ClinicOwnerDashboard";
import ClinicAppointments from "./pages/ClinicOwner/ClinicAppointments";
import ClinicSettings from "./pages/ClinicOwner/ClinicSettings";
import MapPage from "./pages/PetOwnerDashBoard/MapPage";
import SavedClinicsList from "./pages/PetOwnerDashBoard/SavedClinicsList";
import ClinicDetails from "./pages/PetOwnerDashBoard/ClinicDetails";
import Files from "./pages/PetOwnerDashBoard/Files"; // ADD THIS LINE
import Profile from "./pages/PetOwnerDashBoard/Profile";
import EditProfile from "./pages/PetOwnerDashBoard/EditProfile";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import AddPetPage from "./pages/PetOwnerDashBoard/AddPetPage";

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
          element={<LandingPage />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
          path="/map"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <MapPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/pets"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <AddPetPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <SavedClinicsList />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/saved/:id"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <ClinicDetails />
            </RoleProtectedRoute>
          }
        />
        {/* ADD THIS ROUTE FOR FILES */}
        <Route
          path="/files"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <Files />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <Profile />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <EditProfile />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinic-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicOwnerDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinic/appointments"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicAppointments />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinic/settings"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicSettings />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}