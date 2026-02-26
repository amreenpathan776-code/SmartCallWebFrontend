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


const TopNavbar = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
      {/* Title */}
      <h1 className="text-xl font-bold text-slate-900">
        CLAB SmartCall Dashboard
      </h1>

      {/* Navigation */}
      <div className="flex gap-3">
        <Nav to="/dashboard" icon={<FiHome />} label="Home" />
        <Nav to="/transaction" icon={<FiBarChart2 />} label="Transaction" />
        <Nav to="/reports" icon={<FiFileText />} label="Reports" />
        <Nav to="/admin" icon={<FiUsers />} label="Admin" />
        <Nav to="/security" icon={<FiShield />} label="Security" />
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
          localStorage.clear();
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
