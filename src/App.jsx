import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoadingSpinner from "./components/LoadingSpinner";
// OwnerDashboard lives under the PetOwnerDashBoard folder
import OwnerDashboard from "./pages/PetOwnerDashBoard/OwnerDashboard";
import ClinicOwnerDashboard from "./pages/ClinicOwner/ClinicOwnerDashboard";
import ClinicAppointments from "./pages/ClinicOwner/ClinicAppointments";
import ClinicSettings from "./pages/ClinicOwner/ClinicSettings";
import ClinicManagement from "./pages/ClinicOwner/ClinicManagement";
import ClinicRegistration from "./pages/ClinicOwner/ClinicRegistration";
import ClinicFiles from "./pages/ClinicOwner/ClinicFiles";
import ClinicClients from "./pages/ClinicOwner/ClinicClients";
import ClinicProfile from "./pages/ClinicOwner/ClinicProfile";
import ClinicEditProfile from "./pages/ClinicOwner/ClinicEditProfile";
import MapPage from "./pages/PetOwnerDashBoard/MapPage";
import SavedClinicsList from "./pages/PetOwnerDashBoard/SavedClinicsList";
import ClinicDetails from "./pages/PetOwnerDashBoard/ClinicDetails";
import Files from "./pages/PetOwnerDashBoard/Files"; // ADD THIS LINE
import Profile from "./pages/PetOwnerDashBoard/Profile";
import EditProfile from "./pages/PetOwnerDashBoard/EditProfile";
import Settings from "./pages/PetOwnerDashBoard/Settings";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import AddPetPage from "./pages/PetOwnerDashBoard/AddPetPage";
import BookAppointment from "./pages/PetOwnerDashBoard/BookAppointment";

export default function App() {
  const { currentUser, userData } = useAuth();

  // helper component: redirect to role-specific dashboard
  function DashboardRedirect() {
    if (!currentUser) return <Navigate to="/" />;
    // if userData available use it, otherwise show fallback while AuthContext loads data
    if (!userData) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
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
          path="/saved/:clinicId"
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
          path="/settings"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <Settings />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <Navigate to="/map" replace />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinics/:clinicId/appointment"
          element={
            <RoleProtectedRoute allowedRoles={["petOwner"]}>
              <BookAppointment />
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
          path="/clinic/clients"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicClients />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinic/files"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicFiles />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinic/profile"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicProfile />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinic/edit-profile"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicEditProfile />
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
        <Route
          path="/clinic/management"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicManagement />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/clinic/register"
          element={
            <RoleProtectedRoute allowedRoles={["clinicOwner"]}>
              <ClinicRegistration />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}