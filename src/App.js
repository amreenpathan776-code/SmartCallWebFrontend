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

/* Reports pages */
import ActivitySummary from "./pages/reports/ActivitySummary";
import FieldVisitReport from "./pages/reports/FieldVisitReport";
import BorrowersPhone from "./pages/reports/BorrowersPhone";
import CashCollectionReport from "./pages/reports/CashCollectionReport";
import AssignmentSummary from "./pages/reports/AssignmentSummary";
import UserTrips from "./pages/reports/UserTrips";
import LeadDataReport from "./pages/reports/LeadDataReport";

/* Admin pages */
import Branch from "./pages/admin/Branch";
import GenericKey from "./pages/admin/GenericKey";
import GenericClassifier from "./pages/admin/GenericClassifier";
import Product from "./pages/admin/Product";

/* Security Pages */
import SecurityLayout from "./pages/security/SecurityLayout";
import User from "./pages/security/User";
import Role from "./pages/security/Role";


function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <>
      {!isLogin && <TopNavbar />}

      <div className="flex">
        {!isLogin && <Sidebar />}

        <Routes>
          {/* Login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Transaction */}
          <Route path="/transaction" element={<TransactionLayout />}>
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
          </Route>

          {/* Reports */}
          <Route path="/reports" element={<ReportsLayout />}>
            <Route index element={<ActivitySummary />} />
            <Route path="field-visit" element={<FieldVisitReport />} />
            <Route path="borrowers-phone" element={<BorrowersPhone />} />
            <Route path="cash-collection" element={<CashCollectionReport />} />
            <Route path="assignment-summary" element={<AssignmentSummary />} />
            <Route path="user-trips" element={<UserTrips />} />
            <Route path="lead/data" element={<LeadDataReport />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="branch" element={<Branch />} />
            <Route path="generic-key" element={<GenericKey />} />
            <Route path="generic-classifier" element={<GenericClassifier />} />
            <Route path="product" element={<Product />} />
          </Route>

          {/* Security */}
          <Route path="/security" element={<SecurityLayout />}>
            <Route index element={<User />} />
            <Route path="role" element={<Role />} />
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
