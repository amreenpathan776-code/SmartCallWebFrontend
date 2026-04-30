import { useEffect, useState } from "react";
import logo from "../assets/smart-call-logo.png";
import axios from "axios";
import {
  User,
  Building2,
  MapPin,
  BadgeCheck,
  Hash
} from "lucide-react";

const Dashboard = () => {

  const [user, setUser] = useState(null);

  useEffect(() => {

    const userId = localStorage.getItem("userId");

    axios.get(`https://mobile.coastal.bank.in:5001/api/user/${userId}`)
      .then(res => {
        setUser(res.data);
      })
      .catch(err => console.log(err));

  }, []);

const getClusterFromRole = (role) => {
  const match = role?.match(/\((.*?)\)/);
  return match ? match[1] : "";
};

  return (
    <main className="flex-1 p-6">

      <div className="bg-white rounded-2xl min-h-[70vh] shadow-lg border border-slate-200 p-10">

        {/* HEADER BANNER */}

        <div className="flex items-center gap-6 mb-12 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 rounded-xl shadow-md">

          <img
  src={logo}
  alt="Bank Logo"
  className="h-20 bg-white p-2 rounded-lg shadow"
/>

          <div>

            <h1 className="text-3xl font-bold">
              Welcome to Smart Recovery Dashboard
            </h1>

            <p className="opacity-90">
              Coastal Local Area Bank Ltd SmartCall Monitoring System
            </p>

          </div>

        </div>

        {/* USER CARDS */}

        {user && (

  <div className="grid grid-cols-3 gap-8">

    {/* USER ID */}

    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shadow hover:shadow-lg transition">
      <User className="text-blue-600 mb-3" />
      <p className="text-slate-500">User ID</p>
      <h2 className="text-xl font-semibold">{user.UserId}</h2>
    </div>

    {/* USER NAME */}

    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shadow hover:shadow-lg transition">
      <User className="text-blue-600 mb-3" />
      <p className="text-slate-500">User Name</p>
      <h2 className="text-xl font-semibold">{user.UserName}</h2>
    </div>

    {/* DESIGNATION */}

    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shadow hover:shadow-lg transition">
      <BadgeCheck className="text-blue-600 mb-3" />
      <p className="text-slate-500">Designation</p>
      <h2 className="text-xl font-semibold">{user.Designation}</h2>
    </div>

    {/* CLUSTER (ONLY FOR NON-ADMIN) */}

    {user.Role !== "Admin" && (
      <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 shadow hover:shadow-lg transition">
        <MapPin className="text-green-600 mb-3" />
        <p className="text-slate-500">Cluster</p>
        <h2 className="text-xl font-semibold">
  {user.Role.includes("Regional Manager")
    ? getClusterFromRole(user.Role)
    : user.ClusterName}
</h2>
      </div>
    )}

    {/* BRANCH CODE */}

    <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 shadow hover:shadow-lg transition">
      <Hash className="text-green-600 mb-3" />

      <p className="text-slate-500">
        {user.Role === "Admin" || user.Role.includes("Regional Manager")
  ? "Code"
  : "Branch Code"}
      </p>

      <h2 className="text-xl font-semibold">{user.BranchCode}</h2>
    </div>

    {/* BRANCH NAME */}

    <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 shadow hover:shadow-lg transition">
      <Building2 className="text-green-600 mb-3" />

      <p className="text-slate-500">
        {user.Role === "Admin" || user.Role.includes("Regional Manager")
  ? "Office"
  : "Branch Name"}
      </p>

      <h2 className="text-xl font-semibold">{user.BranchName}</h2>
    </div>

  </div>

)}

      </div>

    </main>
  );
};

export default Dashboard;