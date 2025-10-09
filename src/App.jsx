import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./contexts/Authcontext";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const { currentUser } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage />}
        />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

