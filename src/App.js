import "./utils/consoleInterceptor";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Login from "./pages/security/Login";
import TopNavbar from "./components/TopNavbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

/* Layouts */
import TransactionLayout from "./pages/transaction/TransactionLayout";
import ReportsLayout from "./pages/reports/ReportsLayout";
import AdminLayout from "./pages/admin/AdminLayout";

/* Transaction pages */
import MemberList from "./pages/transaction/MemberList";
import FileUpload from "./pages/transaction/FileUpload";
import ActivityStatus from "./pages/transaction/ActivityStatus";
import SendSMS from "./pages/transaction/SendSMS";
import SendWhatsapp from "./pages/transaction/SendWhatsapp";
import LeadLayout from "./pages/transaction/LeadLayout";
import LeadList from "./pages/transaction/LeadList";
import LeadActivityStatus from "./pages/transaction/LeadActivityStatus";
import LeadDataUpload from "./pages/transaction/LeadDataUpload";
import OfferDataUpload from "./pages/transaction/OfferDataUpload";
import SMAUpload from "./pages/transaction/SMAUpload";
import SMAList from "./pages/transaction/SMAList";
import SMAActivityStatus from "./pages/transaction/SMAActivityStatus";

/* Reports pages */
import ActivitySummary from "./pages/reports/ActivitySummary";
import FieldVisitReport from "./pages/reports/FieldVisitReport";
import FieldVisitSummary from "./pages/reports/FieldVisitSummary";
import BorrowersPhone from "./pages/reports/BorrowersPhone";
import CashCollectionReport from "./pages/reports/CashCollectionReport";
import AssignmentSummary from "./pages/reports/AssignmentSummary";
import UserTrips from "./pages/reports/UserTrips";
import LeadDataReport from "./pages/reports/LeadDataReport";

/* Admin pages */
import ProductInfo from "./pages/admin/ProductInfo";
import Branch from "./pages/admin/Branch";
import GenericKey from "./pages/admin/GenericKey";
import GenericClassifier from "./pages/admin/GenericClassifier";
import Product from "./pages/admin/Product";

/* Security Pages */
import SecurityLayout from "./pages/security/SecurityLayout";
import User from "./pages/security/User";
import Role from "./pages/security/Role";
import LockedAccounts from "./pages/security/LockedAccounts";

import AccessRestricted from "./components/AccessRestricted";

const ProtectedRoute = ({ children, allowedRole }) => {

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  // 🚫 Not logged in → always redirect to login
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  // 🚫 Role restriction
  if (allowedRole && role !== allowedRole) {
    return <AccessRestricted />;
  }

  return children;
};

const ProtectedLockedAccounts = ({ children }) => {
  const userId = localStorage.getItem("userId");

  const allowedUsers = [
    "IT_099_1011",
    "IT_099_1009",
    "IT_099_866"
  ];

  if (!allowedUsers.includes(userId)) {
    return <AccessRestricted />;
  }

  return children;
};


function App() {
  return (
    <BrowserRouter basename="/SmartRecovery">
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {

  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId");
  const isLoginPage = location.pathname.endsWith("/login");

  // ================================
  // AUTO LOGOUT AFTER INACTIVITY
  // ================================
  useEffect(() => {

    if (!userId) return;

    let timeout;

    const logoutUser = () => {
  localStorage.clear();
  navigate("/login", { replace: true });
};

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(logoutUser, 6 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };

  }, [userId, navigate]);

  // 🔒 Redirect if not logged in
  if (!userId && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {userId && <TopNavbar />}

      <div className="flex">
        {userId && <Sidebar />}

        <Routes>
          {/* Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          

          {/* Dashboard */}
          <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

          {/* Transaction */}
          <Route
  path="/transaction"
  element={
    <ProtectedRoute>
      <TransactionLayout />
    </ProtectedRoute>
  }
>
            <Route index element={<MemberList />} />
            <Route path="file-upload" element={<FileUpload />} />
            <Route path="activity-status" element={<ActivityStatus />} />
            <Route path="send-sms" element={<SendSMS />} />
            <Route path="send-whatsapp" element={<SendWhatsapp />} />

            {/* Lead */}
            <Route path="lead" element={<LeadLayout />}>
              <Route index element={<LeadList />} />
              <Route path="activity-status" element={<LeadActivityStatus />} />
              <Route path="data-upload" element={<LeadDataUpload />} />
              <Route path="offer-upload" element={<OfferDataUpload />} />
            </Route>

 {/* SMA */}
  <Route path="sma/upload" element={<SMAUpload />} />
  <Route path="sma/list" element={<SMAList />} />
  <Route path="sma/activity-status" element={<SMAActivityStatus />} />

          </Route>

          {/* Reports */}
          <Route
  path="/reports"
  element={
    <ProtectedRoute>
      <ReportsLayout />
    </ProtectedRoute>
  }
>
            <Route index element={<ActivitySummary />} />
            <Route path="field-visit" element={<FieldVisitReport />} />
            <Route path="field-visit-summary" element={<FieldVisitSummary />} />
            <Route path="borrowers-phone" element={<BorrowersPhone />} />
            <Route path="cash-collection" element={<CashCollectionReport />} />
            <Route path="assignment-summary" element={<AssignmentSummary />} />
            <Route path="user-trips" element={<UserTrips />} />
            <Route path="lead/data" element={<LeadDataReport />} />
          </Route>

          {/* Admin */}
          <Route
  path="/admin"
  element={
    <ProtectedRoute allowedRole="Admin">
      <AdminLayout />
    </ProtectedRoute>
  }
>
            <Route path="product-info" element={<ProductInfo />} />
            <Route path="branch" element={<Branch />} />
            <Route path="generic-key" element={<GenericKey />} />
            <Route path="generic-classifier" element={<GenericClassifier />} />
            <Route path="product" element={<Product />} />
          </Route>

          {/* Security */}
          <Route
  path="/security"
  element={
    <ProtectedRoute allowedRole="Admin">
      <SecurityLayout />
    </ProtectedRoute>
  }
>
            <Route index element={<User />} />
            <Route path="role" element={<Role />} />
            <Route
  path="locked-accounts"
  element={
    <ProtectedLockedAccounts>
      <LockedAccounts />
    </ProtectedLockedAccounts>
  }
/>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
