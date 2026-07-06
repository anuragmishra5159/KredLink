import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LandingPage        from "./pages/LandingPage";
import OnboardingPage     from "./pages/OnboardingPage";
import ConsentPage        from "./pages/ConsentPage";
import ProcessingPage     from "./pages/ProcessingPage";
import StatusPage         from "./pages/StatusPage";
import OfficerLoginPage   from "./pages/OfficerLoginPage";
import OfficerDashboard   from "./pages/OfficerDashboard";
import ReviewQueuePage    from "./pages/ReviewQueuePage";
import MerchantDetailPage from "./pages/MerchantDetailPage";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/officer/login" replace />;
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"                     element={<LandingPage />} />
        <Route path="/apply/onboard"        element={<OnboardingPage />} />
        <Route path="/apply/consent/:id"    element={<ConsentPage />} />
        <Route path="/apply/processing/:id" element={<ProcessingPage />} />
        <Route path="/apply/status/:id"     element={<StatusPage />} />
        <Route path="/officer/login"        element={<OfficerLoginPage />} />
        <Route path="/officer/queue"        element={<ProtectedRoute><ReviewQueuePage /></ProtectedRoute>} />
        <Route path="/officer/dashboard"    element={<ProtectedRoute><OfficerDashboard /></ProtectedRoute>} />
        <Route path="/officer/merchant/:id" element={<ProtectedRoute><MerchantDetailPage /></ProtectedRoute>} />
        <Route path="*"                     element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
