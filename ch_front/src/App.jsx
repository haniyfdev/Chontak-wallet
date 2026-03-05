import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import SendMoneyPage from "./pages/SendMoneyPage";
import CardsPage from "./pages/CardsPage";
import ProfilePage from "./pages/ProfilePage";
import SavedCardsPage from "./pages/SavedCardsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import Layout from "./components/Layout";

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { isAuthenticated, fetchMe } = useAuthStore();
  useEffect(() => { if (isAuthenticated) fetchMe(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="send" element={<SendMoneyPage />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="saved-cards" element={<SavedCardsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}