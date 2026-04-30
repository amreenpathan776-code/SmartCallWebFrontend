import {
  FiHome,
  FiBarChart2,
  FiFileText,
  FiShield,
  FiUsers,
  FiLogOut,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");

const TopNavbar = () => {

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const isAdminUser = role === "Admin";

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
      {/* Title */}
      <div className="flex items-center gap-6">
  <h1 className="text-xl font-bold text-blue-900">
    CLAB Smart Recovery Dashboard
  </h1>

  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
    <span className="text-sm font-semibold text-blue-800">
      👤 {userId}
    </span>
  </div>
</div>

      {/* Navigation */}
      <div className="flex gap-3">
  <Nav to="/dashboard" icon={<FiHome />} label="Home" />
  <Nav to="/transaction" icon={<FiBarChart2 />} label="Transaction" />
  <Nav to="/reports" icon={<FiFileText />} label="Reports" />

  {isAdminUser && (
    <Nav to="/admin/branch" icon={<FiUsers />} label="Admin" />
  )}

  {isAdminUser && (
    <Nav to="/security" icon={<FiShield />} label="Security" />
  )}

  <Nav icon={<FiLogOut />} label="Logout" danger logout />
</div>
    </header>
  );
};

/* Reusable Nav Button */
const Nav = ({ icon, label, to, danger, logout }) => {
  const navigate = useNavigate();

  const baseClass =
    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition";

  const normalClass =
    "border border-slate-300 text-slate-700 hover:bg-slate-100";

  const activeClass =
    "bg-primary text-white border border-primary";

  const dangerClass =
    "text-red-600 border border-red-300 hover:bg-red-50";

  // LOGOUT BUTTON
  if (logout) {
    return (
      <button
        onClick={() => {

  // 🔹 STEP 1: Capture user details BEFORE clearing
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const branch = localStorage.getItem("branchName");
  const cluster = localStorage.getItem("clusterName");

  // 🔹 STEP 2: Log logout start
  logInfo("Logout initiated", {
    userId,
    role,
    branch,
    cluster
  });

  try {

    // 🔹 STEP 3: Clear session
    logInfo("Clearing user session");
    localStorage.clear();

    // 🔹 STEP 4: Success log
    logSuccess("User logged out successfully", {
      userId
    });

  } catch (err) {

    // 🔹 STEP 5: Error log (rare case)
    logError("Logout error", err);

  }

  // 🔹 STEP 6: Navigation
  logInfo("Redirecting to login page", { userId });
  navigate("/login", { replace: true });

}}
        className={`${baseClass} ${danger ? dangerClass : normalClass}`}
      >
        {icon}
        {label}
      </button>
    );
  }

  // ROUTED BUTTONS
  if (to) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `${baseClass} ${isActive ? activeClass : normalClass}`
        }
      >
        {icon}
        {label}
      </NavLink>
    );
  }

  // DEFAULT FALLBACK
  return (
    <button className={`${baseClass} ${danger ? dangerClass : normalClass}`}>
      {icon}
      {label}
    </button>
  );
};


export default TopNavbar;
