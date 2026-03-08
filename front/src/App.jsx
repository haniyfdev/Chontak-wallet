import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import SendMoneyPage from "./pages/SendMoneyPage";
import CardsPage from "./pages/CardsPage";
import CardDetailPage from "./pages/CardDetailPage";
import SavedCardsPage from "./pages/SavedCardsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import AdminControl from "./pages/AdminControl";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function AppInit({ children }) {
  const { isAuthenticated, fetchMe } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated) fetchMe();
  }, []);
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="send" element={<SendMoneyPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="cards/:cardId" element={<CardDetailPage />} />
            <Route path="saved-cards" element={<SavedCardsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin-control" element={<AdminControl />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppInit>
    </BrowserRouter>
  );
}
