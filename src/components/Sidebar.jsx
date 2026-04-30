import { NavLink, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

const role = localStorage.getItem("role");

const isAdminUser = role === "Admin";
const isRegionalManager = role?.startsWith("Regional Manager");
const canViewSMA = isAdminUser || isRegionalManager;

const userId = localStorage.getItem("userId");

const canViewLockedAccounts = [
  "IT_099_1011",
  "IT_099_1009",
  "IT_099_866"
].includes(userId);

  const isTransaction = location.pathname.startsWith("/transaction");
  const isReports = location.pathname.startsWith("/reports");
  const isAdmin = location.pathname.startsWith("/admin");
  const isSecurity = location.pathname.startsWith("/security");
  const isDashboard = location.pathname === "/dashboard";

  


  const showModules = isTransaction;


  const baseClass =
    "block px-4 py-2 rounded cursor-pointer text-sm transition";

  const activeClass = "bg-primary text-white";
  const inactiveClass = "text-slate-700 hover:bg-slate-100";

  const linkClass = ({ isActive }) =>
    `${baseClass} ${isActive ? activeClass : inactiveClass}`;

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      {/* ================= DASHBOARD ================= */}
 
 {!isDashboard && (
  <NavLink to="/dashboard" className={linkClass}>
    Dashboard
  </NavLink>
)}

      {/* ================= NPA + LEAD MODULES ================= */}
      {showModules && (
        <>
          {/* -------- NPA SECTION -------- */}
          <p className="text-sm font-bold text-slate-900 uppercase mt-6 mb-2">
  NPA
</p>

          <NavLink
            to="/transaction"
            end
            className={() =>
              `${baseClass} ${
                location.pathname === "/transaction"
                  ? activeClass
                  : inactiveClass
              }`
            }
          >
            Member List
          </NavLink>

          {isAdminUser && (
  <NavLink to="/transaction/file-upload" className={linkClass}>
    File Upload
  </NavLink>
)}

          <NavLink to="/transaction/activity-status" className={linkClass}>
            Activity Status
          </NavLink>

          {/* -------- LEAD SECTION -------- */}
          <p className="text-sm font-bold text-slate-900 uppercase mt-6 mb-2">
            Lead
          </p>

          <NavLink
  to="/transaction/lead"
  end
  className={() =>
    `${baseClass} ${
      location.pathname === "/transaction/lead"
        ? activeClass
        : inactiveClass
    }`
  }
>
  Lead List
</NavLink>

<NavLink to="/transaction/lead/activity-status" className={linkClass}>
  Lead Activity Status
</NavLink>

{isAdminUser && (
  <NavLink to="/transaction/lead/data-upload" className={linkClass}>
    Lead Data Upload
  </NavLink>
)}

{/* -------- SMA SECTION -------- */}
{canViewSMA && (
  <>
    <p className="text-sm font-bold text-slate-900 uppercase mt-6 mb-2">
      SMA & NPA
    </p>

    {isAdminUser && (
      <NavLink to="/transaction/sma/upload" className={linkClass}>
        File Upload
      </NavLink>
    )}

    <NavLink to="/transaction/sma/list" className={linkClass}>
      SMA & NPA List
    </NavLink>

    <NavLink to="/transaction/sma/activity-status" className={linkClass}>
      SMA & NPA Activity Status
    </NavLink>
  </>
)}

        </>
      )}

      {/* ================= REPORTS MODULE ================= */}
      {isReports && (
        <>
          <Section title="NPA Reports">
            <NavLink to="/reports" end className={linkClass}>
              Activity Summary
            </NavLink>

            <NavLink to="/reports/field-visit" className={linkClass}>
              Field Visit Report
            </NavLink>

            <NavLink to="/reports/field-visit-summary" className={linkClass}>
  Field Visit Summary
</NavLink>

            <NavLink to="/reports/borrowers-phone" className={linkClass}>
              Borrowers Contacted By Phone
            </NavLink>

            <NavLink to="/reports/cash-collection" className={linkClass}>
              Cash Collection Report
            </NavLink>

            <NavLink to="/reports/assignment-summary" className={linkClass}>
              Assignment Summary
            </NavLink>

            <NavLink to="/reports/user-trips" className={linkClass}>
              User Trips
            </NavLink>
          </Section>

          {/* -------- LEAD REPORTS -------- */}
          <Section title="Lead Reports">
            <NavLink to="/reports/lead/data" className={linkClass}>
              Lead Data Report
            </NavLink>
          </Section>
        </>
      )}

{/* ================= ADMIN ================= */}
      {isAdmin && isAdminUser && (
        <>
          <p className="text-sm font-bold text-slate-900 uppercase mt-6 mb-2">
            Admin
          </p>

          <NavLink to="/admin/branch" className={linkClass}>
            Branch
          </NavLink>

          <NavLink to="/admin/product" className={linkClass}>
            Product
          </NavLink>
        </>
      )}

      {/* ================= SECURITY ================= */}
{isSecurity && isAdminUser && (
  <>
    <p className="text-sm font-bold text-slate-900 uppercase mt-6 mb-2">
      Security
    </p>

    <NavLink to="/security" end className={linkClass}>
      User
    </NavLink>

    <NavLink to="/security/role" className={linkClass}>
      Role
    </NavLink>
    {canViewLockedAccounts && (
  <NavLink to="/security/locked-accounts" className={linkClass}>
    Locked Accounts
  </NavLink>
)}
  </>
)}
    </aside>
  );
};


const Section = ({ title, children }) => (
  <>
    <p className="text-sm font-bold text-slate-900 uppercase mt-6 mb-2">
      {title}
    </p>
    {children}
  </>
);

export default Sidebar;
