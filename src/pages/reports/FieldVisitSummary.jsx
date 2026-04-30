import { useEffect, useState } from "react";

// ✅ ADD BELOW THIS LINE
const getUserId = () => localStorage.getItem("userId") || "Unknown";

const logInfo = (msg, data) =>
  console.log(`📡 [User:${getUserId()}] ${msg}`, data || "");

const logSuccess = (msg, data) =>
  console.log(`✅ [User:${getUserId()}] ${msg}`, data || "");

const logError = (msg, data) =>
  console.error(`❌ [User:${getUserId()}] ${msg}`, data || "");

const logWarn = (msg, data) =>
  console.warn(`⚠️ [User:${getUserId()}] ${msg}`, data || "");

const FieldVisitSummary = () => {

  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);

  const [cluster, setCluster] = useState("");
  const [branch, setBranch] = useState("");
  const [user, setUser] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [tableData, setTableData] = useState([]);
  const RECORDS_PER_PAGE = 15;

const [currentPage, setCurrentPage] = useState(1);

  const EXPORT_COLUMNS = [
  { key: "UserName", label: "User Name" },
  { key: "BranchName", label: "Branch Name" },
  { key: "DistanceTravelled", label: "Distance Travelled" },
  { key: "AccountCount", label: "No. Of Accounts" }
];

const [showExport, setShowExport] = useState(false);

const [fileName, setFileName] = useState(
  `Field_Visit_Summary_${new Date().toISOString().slice(0,10)}`
);

const [selectedColumns, setSelectedColumns] = useState(
  EXPORT_COLUMNS.map(c => c.key)
);

  const role = localStorage.getItem("role") || "";

  useEffect(() => {
  logInfo("FIELD VISIT SUMMARY PAGE LOADED", {
    role,
    userId: localStorage.getItem("userId")
  });
}, [role]);

  const isBranchManager = role === "Branch Manager";

  const isRegionalManager = role?.startsWith("Regional Manager");

let userCluster = "";

if (isRegionalManager) {
  const match = role.match(/\((.*?)\)/);
  userCluster = match ? match[1] : "";
}

useEffect(() => {
logInfo("RM effect triggered", { isRegionalManager, userCluster });
  if (isRegionalManager) {

    setCluster(userCluster);

    logInfo("Fetching branches for RM", userCluster);

fetch(`https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(userCluster)}`)
  .then(res => {
    if (!res.ok) {
      logError("RM Branch API failed", res.status);
      throw new Error("API failed");
    }
    return res.json();
  })
  .then(data => {
    logSuccess("RM branches fetched", data);
    setBranches(data);
  })
  .catch(err => {
    logError("RM branch fetch error", err);
    setBranches([]);
  });

  }

}, [isRegionalManager, userCluster]);

useEffect(() => {

  if (isBranchManager) {

    const userBranch = localStorage.getItem("branchName");
    const userCluster = localStorage.getItem("clusterName");

    if (userBranch) setBranch(userBranch);
    if (userCluster) setCluster(userCluster);

  }

}, [isBranchManager]);

  // ================= LOAD CLUSTERS =================
  useEffect(() => {
    logInfo("Fetching clusters API started");
    fetch("https://mobile.coastal.bank.in:5001/api/clusters")
  .then(res => {
    if (!res.ok) {
      logError("Clusters API failed", res.status);
      throw new Error("API failed");
    }
    return res.json();
  })
  .then(data => {
    logSuccess("Clusters fetched", data);
    setClusters([
      { cluster_name: "Corporate Office" },
      ...data
    ]);
  })
  .catch(err => {
    logError("Cluster fetch error", err);
  });
  }, []);

  useEffect(() => {

    logInfo("Fetching users API called", {
  cluster,
  branch,
  isBranchManager,
  isRegionalManager
});

  const branchToUse = isBranchManager
    ? localStorage.getItem("branchName")
    : branch || "";

  const clusterToUse = isBranchManager
    ? localStorage.getItem("clusterName")
    : isRegionalManager
    ? userCluster
    : cluster || "";

  fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": localStorage.getItem("userId")
    },
    body: JSON.stringify({
      cluster: clusterToUse,
      branchName: branchToUse
    })
  })
    .then(res => {
  logInfo("Users API status", res.status);
  if (!res.ok) {
    logError("Users API failed", res.status);
    throw new Error("API failed");
  }
  return res.json();
})
.then(data => {
  logSuccess("Users fetched", data);
  setUsers(Array.isArray(data) ? data : []);
})
.catch(err => {
  logError("Users fetch error", err);
  setUsers([]);
});

}, [cluster, branch, isBranchManager, isRegionalManager, userCluster]);


  // ================= SEARCH =================
  const handleSearch = () => {

    logInfo("FIELD VISIT SUMMARY SEARCH STARTED", {
  user, cluster, branch, fromDate, toDate
});

    const hasFilter = [user, fromDate, toDate, cluster, branch]
      .some(v => v && v !== "");

    if (!hasFilter) {
      alert("Please select at least one filter");
      logWarn("Search blocked - no filters");
      return;
    }

    logInfo("Calling summary API");
    fetch("https://mobile.coastal.bank.in:5001/api/field-visit-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": localStorage.getItem("userId")
      },
      body: JSON.stringify({
        user,
        cluster,
        branch,
        fromDate,
        toDate
      })
    })
      .then(res => {
  logInfo("API response status", res.status);
  return res.json();
})
.then(data => {
  logSuccess("Search results received", {
    count: Array.isArray(data) ? data.length : 0
  });

  setTableData(Array.isArray(data) ? data : []);
  setCurrentPage(1);
})
.catch(err => {
  logError("SUMMARY SEARCH ERROR", err);
  setTableData([]);
});

  };

  // ================= RESET =================
  const handleReset = () => {

    logInfo("RESET STARTED");

  if (isBranchManager) {

    const userBranch = localStorage.getItem("branchName");
    const userCluster = localStorage.getItem("clusterName");

    setCluster(userCluster || "");
    setBranch(userBranch || "");

  } else if (isRegionalManager) {

    setCluster(userCluster);
    setBranch("");

  } else {

    setCluster("");
    setBranch("");

  }

  setUser("");
  setFromDate("");
  setToDate("");
  setTableData([]);
  setCurrentPage(1);
logSuccess("RESET COMPLETED");
};

useEffect(() => {

  logInfo("Cluster changed", cluster);
  if (!cluster) {
    setBranches([]);
    return;
  }

  setUser(""); // reset user when cluster changes

  logInfo("Fetching branches for cluster", cluster);

fetch(`https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(cluster)}`)
  .then(res => {
    if (!res.ok) {
      logError("Cluster Branch API failed", res.status);
      throw new Error("API failed");
    }
    return res.json();
  })
  .then(data => {
    logSuccess("Cluster branches fetched", data);
    setBranches(data);
  })
  .catch(err => {
    logError("Cluster branch fetch error", err);
    setBranches([]);
  });

  logInfo("Fetching users for cluster", cluster);

fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userId")
  },
  body: JSON.stringify({ cluster })
})
  .then(res => {
    logInfo("Users API status (cluster)", res.status);
    if (!res.ok) {
      logError("Users API failed (cluster)", res.status);
      throw new Error("API failed");
    }
    return res.json();
  })
  .then(data => {
    logSuccess("Users fetched (cluster)", data);
    setUsers(Array.isArray(data) ? data : []);
  })
  .catch(err => {
    logError("Users fetch error (cluster)", err);
    setUsers([]);
  });

}, [cluster]);


useEffect(() => {

  logInfo("Branch changed", { branch, cluster });
  if (!branch) return;

  setUser(""); // reset user when branch changes

  logInfo("Fetching users for branch", branch);

fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userId")
  },
  body: JSON.stringify({
    cluster,
    branchName: branch
  })
})
  .then(res => {
    logInfo("Users API status (branch)", res.status);
    if (!res.ok) {
      logError("Users API failed (branch)", res.status);
      throw new Error("API failed");
    }
    return res.json();
  })
  .then(data => {
    logSuccess("Users fetched (branch)", data);
    setUsers(Array.isArray(data) ? data : []);
  })
  .catch(err => {
    logError("Users fetch error (branch)", err);
    setUsers([]);
  });

}, [branch, cluster]);

const exportExcel = () => {

  logInfo("EXCEL EXPORT STARTED", {
  rows: tableData.length,
  fileName
});

  if (tableData.length === 0) {
    alert("No data available to export");
    return;
  }

  const dataToExport = tableData.map((row, index) => ({
    SNo: index + 1,
    ...row
  }));

  logInfo("Calling Excel export API");
  fetch("https://mobile.coastal.bank.in:5001/api/field-visit-summary/export-excel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": localStorage.getItem("userId")
    },
    body: JSON.stringify({
      columns: selectedColumns,
      data: dataToExport
    })
  })
    .then(res => res.blob())
    .then(blob => {
  logSuccess("Excel received from backend");

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.xlsx`;
      a.click();

      window.URL.revokeObjectURL(url);

      setShowExport(false);

    })
    .catch(err => {
  logError("EXCEL EXPORT ERROR", err);
});

};

const totalPages = Math.max(
  1,
  Math.ceil(tableData.length / RECORDS_PER_PAGE)
);

const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;

const endIndex = startIndex + RECORDS_PER_PAGE;

const paginatedData = tableData.slice(startIndex, endIndex);

const indexOfFirstRecord = tableData.length === 0 ? 0 : startIndex + 1;

const indexOfLastRecord = Math.min(endIndex, tableData.length);

  return (
    <div className="p-6 w-full">

      {/* FILTERS */}
      <div className="bg-white rounded-xl p-6">

        <div className="grid grid-cols-5 gap-6">

          {/* User */}
          <div>
            <label className="text-sm text-slate-600">User</label>

            <select
              value={user}
              onChange={e => {
  logInfo("User changed", e.target.value);
  setUser(e.target.value);
}}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>

              {users.map(u => (
                <option key={u.userId} value={u.userId}>
                  {u.name}
                </option>
              ))}

            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="text-sm text-slate-600">From Date</label>

            <input
              type="date"
              value={fromDate}
              onChange={e => {
  logInfo("From Date changed", e.target.value);
  setFromDate(e.target.value);
}}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-sm text-slate-600">To Date</label>

            <input
              type="date"
              value={toDate}
              onChange={e => {
  logInfo("To Date changed", e.target.value);
  setToDate(e.target.value);
}}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* Cluster */}
          <div>
            <label className="text-sm text-slate-600">Cluster</label>

            <select
  value={cluster}
  onChange={e => {
  logInfo("Cluster changed (UI)", e.target.value);
  setCluster(e.target.value);
  setBranch("");
}}
  disabled={isBranchManager || isRegionalManager}
  className={`w-full mt-1 px-3 py-2 border rounded font-semibold ${
    isBranchManager || isRegionalManager
      ? "bg-slate-300 cursor-not-allowed"
      : "bg-slate-100"
  }`}
>
              <option value="">Select</option>

              {clusters.map(c => (
                <option key={c.cluster_name} value={c.cluster_name}>
                  {c.cluster_name}
                </option>
              ))}

            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="text-sm text-slate-600">Branch</label>

           <select
  value={branch}
  onChange={e => {
  logInfo("Branch changed (UI)", e.target.value);
  setBranch(e.target.value);
}}
  disabled={!cluster || isBranchManager}
  className={`w-full mt-1 px-3 py-2 border rounded font-semibold ${
    isBranchManager
      ? "bg-slate-300 cursor-not-allowed"
      : "bg-slate-100"
  }`}
>
              <option value="">Select</option>

              {branches.map(b => (
                <option key={b.branch_name} value={b.branch_name}>
                  {b.branch_name}
                </option>
              ))}

            </select>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-6">

          <button
            className="px-6 py-2 bg-primary text-white rounded"
            onClick={handleSearch}
          >
            Search
          </button>

          <button
            className="px-6 py-2 bg-slate-200 rounded"
            onClick={handleReset}
          >
            Reset
          </button>

          <button
  className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
  onClick={() => setShowExport(true)}
  disabled={tableData.length === 0}
>
  Export Data
</button>

        </div>

      </div>

      {/* TABLE */}
<div className="bg-white rounded-xl border mt-6 flex flex-col overflow-hidden">

  {/* Record Count */}
  <div className="text-center py-3 font-semibold border-b">
    No. Of Records: {tableData.length}
  </div>

        <table className="w-full text-sm border border-slate-300 border-collapse">

          <thead>

            <tr className="bg-slate-100 text-left">

              <th className="px-4 py-3 border">S. No.</th>
              <th className="px-4 py-3 border">User Name</th>
              <th className="px-4 py-3 border">Branch Name</th>
              <th className="px-4 py-3 border">Distance Travelled</th>
              <th className="px-4 py-3 border">No. Of Accounts</th>

            </tr>

          </thead>

          <tbody>

  {tableData.length === 0 ? (

    <tr>
      <td colSpan="5" className="text-center py-16 text-slate-400 border">
        No records found
      </td>
    </tr>

  ) : (

    <>
      {paginatedData.map((row, index) => {
        const rowIndex = startIndex + index;

        return (
          <tr key={rowIndex} className="border-b">
            <td className="border px-4 py-2">{rowIndex + 1}</td>
            <td className="border px-4 py-2">{row.UserName}</td>
            <td className="border px-4 py-2">{row.BranchName}</td>
            <td className="border px-4 py-2">{row.DistanceTravelled}</td>
            <td className="border px-4 py-2">{row.AccountCount}</td>
          </tr>
        );
      })}
    </>

  )}

</tbody>
        </table>

        {tableData.length > 0 && (
  <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50 text-sm text-slate-600">

    {/* Showing Records */}
    <div>
      Showing {indexOfFirstRecord}–{indexOfLastRecord} of {tableData.length}
    </div>

    {/* Pagination Controls */}
    <div className="flex items-center gap-2">

      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(1)}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        ⏮
      </button>

      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => p - 1)}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        ◀
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(p => p + 1)}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        ▶
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(totalPages)}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        ⏭
      </button>

    </div>

  </div>
)}

      </div>

      
      {showExport && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white w-[500px] rounded-xl shadow-lg p-6">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Export Data</h2>
        <button onClick={() => setShowExport(false)}>✖</button>
      </div>

      <div className="mb-4">
        <label className="text-sm text-slate-600">Filename</label>

        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded"
        />
      </div>

      <div className="max-h-[250px] overflow-y-auto border rounded">

        {EXPORT_COLUMNS.map(col => (

          <label
            key={col.key}
            className="flex items-center gap-3 px-4 py-2 border-b cursor-pointer"
          >

            <input
              type="checkbox"
              checked={selectedColumns.includes(col.key)}
              onChange={() => {

                setSelectedColumns(prev =>
                  prev.includes(col.key)
                    ? prev.filter(k => k !== col.key)
                    : [...prev, col.key]
                );

              }}
            />

            {col.label}

          </label>

        ))}

      </div>

      <div className="flex justify-end gap-3 mt-6">

        <button
          className="px-4 py-2 bg-slate-200 rounded"
          onClick={() => setShowExport(false)}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={exportExcel}
        >
          Export Excel
        </button>

      </div>

    </div>

  </div>
)}

    </div>
  );
};

export default FieldVisitSummary;