import { useEffect, useState, useMemo } from "react";

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

const RECORDS_PER_PAGE = 15;

const FieldVisitReport = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const EXPORT_COLUMNS = [
  { key: "UserName", label: "User Name" },
  { key: "AccountNo", label: "Account Number" },
  { key: "CustomerName", label: "Customer Name" },
  { key: "BranchLatitude", label: "Branch Lat" },
  { key: "BranchLongitude", label: "Branch Lon" },
  { key: "MeetingDate", label: "Meeting Date" },
  { key: "StartLatitude", label: "Start Lat" },
  { key: "StartLongitude", label: "Start Lon" },
  { key: "MeetingLatitude", label: "Meeting Lat" },
  { key: "MeetingLongitude", label: "Meeting Lon" },
  { key: "MeetingAddress", label: "Meeting Address" },
  { key: "DistanceTravelled", label: "Distance Travelled" },
  { key: "CustomerLatitude", label: "Customer Lat" },
  { key: "CustomerLongitude", label: "Customer Lon" },
  { key: "Variance", label: "Variance" },
  { key: "Flow", label: "Flow" }
];

  // ================= STATE =================
  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);

  const [cluster, setCluster] = useState("");
  const [branch, setBranch] = useState("");
  const [user, setUser] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [initialUsers, setInitialUsers] = useState([]);

  const [selectedRows, setSelectedRows] = useState([]);
const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

const [fileName, setFileName] = useState(
  `Field_Visit_Report_${new Date().toISOString().slice(0,10)}`
);

const role = localStorage.getItem("role");

// ✅ ADD BELOW
useEffect(() => {
  logInfo("FIELD VISIT REPORT PAGE LOADED", {
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

  logInfo("Regional Manager effect triggered", { isRegionalManager, userCluster });
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
  logSuccess("RM Branches fetched", data);
  setBranches(data);
})
.catch(err => {
  logError("RM Branch fetch error", err);
  setBranches([]);
});

  }

}, [isRegionalManager, userCluster]);
  
  const [showExport, setShowExport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    
  EXPORT_COLUMNS.map(c => c.key) // all selected by default
);


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
      logError("CLUSTER FETCH ERROR", err);
    });

}, []);

  // ================= LOAD USERS INITIALLY =================
useEffect(() => {

  logInfo("Initial Users API called", {
  isBranchManager,
});

  const userBranch = localStorage.getItem("branchName");
  const userCluster = localStorage.getItem("clusterName");

  const bodyData = isBranchManager
    ? { cluster: userCluster, branchName: userBranch }
    : {};

  fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": localStorage.getItem("userId")
    },
    body: JSON.stringify(bodyData)
  })
    .then(res => {
  if (!res.ok) {
    logError("AssignUsers API failed", res.status);
    throw new Error("Unauthorized");
  }
  return res.json();
})
.then(data => {
  logSuccess("Initial users fetched", data);
      const safeData = Array.isArray(data) ? data : [];
      setUsers(safeData);
      setInitialUsers(safeData);
    })
    .catch(err => {
  logError("Initial users fetch error", err);
      setUsers([]);
      setInitialUsers([]);
    });

}, [isBranchManager]);

  // ================= CLUSTER CHANGE =================
useEffect(() => {
  logInfo("Cluster changed", cluster);

  if (!cluster) return;

logInfo("Fetching branches for cluster", cluster);
  fetch(`https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(cluster)}`)
  .then(res => {
    if (!res.ok) {
      logError("Branch API failed", res.status);
      throw new Error("API failed");
    }
    return res.json();
  })
  .then(data => {
    logSuccess("Branches fetched (cluster change)", data);
    setBranches(data);
  })
  .catch(err => {
    logError("Cluster branch fetch error", err);
    setBranches([]);
  });

  // 🚫 Do not load users here for Branch Manager
  if (isBranchManager) return;

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
      logInfo("Users API status", res.status);
  if (!res.ok) {
    logError("Users API failed", res.status);
    throw new Error("API failed");
  }
  return res.json();
})
.then(data => {
  logSuccess("Users fetched (cluster change)", data);
  setUsers(Array.isArray(data) ? data : []);
})
.catch(err => {
  logError("Branch fetch error", err);
});

}, [cluster, isBranchManager]);

  // ================= BRANCH CHANGE =================
  useEffect(() => {
    logInfo("Branch changed", { branch, cluster });
    if (!branch) return;

    logInfo("Fetching users for branch", branch);
    fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  "x-user-id": localStorage.getItem("userId")
},
      body: JSON.stringify({ cluster, branchName: branch })
    })
      .then(res => {
  if (!res.ok) {
    logError("AssignUsers API failed", res.status);
    throw new Error("Unauthorized");
  }
  logInfo("Branch users API status", res.status);
  return res.json();
})
.then(data => {
  logSuccess("Branch users fetched", data);
  setUsers(Array.isArray(data) ? data : []);
  setInitialUsers(Array.isArray(data) ? data : []);
})
.catch(err => {
  logError("Branch users fetch error", err);
  setUsers([]);
  setInitialUsers([]);
});
  }, [branch, cluster]);

  // ================= SEARCH =================
  const [tableData, setTableData] = useState([]);

const handleSearch = () => {
  logInfo("FIELD VISIT SEARCH STARTED", {
  user, cluster, branch, fromDate, toDate
});
  const hasAnyFilter = [
    user,
    fromDate,
    toDate,
    cluster,
    branch
  ].some(v => v && v.trim() !== "");

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching");
    logWarn("Search blocked - no filters");
    return;
  }

  const userId = localStorage.getItem("userId");

if (!userId) {
  alert("Session expired. Please login again.");
  window.location.href = "/";
  logError("User session missing");
  return;
}

logInfo("Calling Field Visit API");
fetch("https://mobile.coastal.bank.in:5001/api/field-visit-report", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-user-id": userId
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
      setSelectedRows([]);
      setSelectAllPage(false);
      setSelectAllAllPages(false);
    })
    .catch(err => {
  logError("FIELD VISIT SEARCH ERROR", err);
  setTableData([]);
});
};

const exportPDF = () => {

  logInfo("PDF EXPORT STARTED", {
  selectedRows: selectedRows.length,
  fileName
});

  // 🔹 If no rows selected → export ALL results
  const rowsToExport =
    selectedRows.length === 0
      ? tableData.map((row, i) => ({
          SNo: i + 1,
          ...row
        }))
      : selectedRows
          .sort((a, b) => a - b)
          .map(index => ({
            SNo: index + 1,
            ...tableData[index]
          }));

          logInfo("Calling PDF export API");
  fetch("https://mobile.coastal.bank.in:5001/api/field-visit-report/export-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": localStorage.getItem("userId")
    },
    body: JSON.stringify({
      columns: selectedColumns,
      data: rowsToExport
    })
  })
    .then(res => res.blob())
.then(blob => {
  logSuccess("PDF received from backend");

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
  setShowExport(false);
})
    .catch(err => {
  logError("PDF EXPORT ERROR", err);
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

  } 
  else if (isRegionalManager) {

    setCluster(userCluster);
    setBranch("");

  } 
  else {

    setCluster("");
    setBranch("");

  }

  setUser("");
  setFromDate("");
  setToDate("");

  setUsers(initialUsers);
  setTableData([]);
  setCurrentPage(1);

  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);
logSuccess("RESET COMPLETED");
};

const totalPages = Math.max(
  1,
  Math.ceil(tableData.length / RECORDS_PER_PAGE)
);

const indexOfFirstRecord = (currentPage - 1) * RECORDS_PER_PAGE + 1;

const indexOfLastRecord = Math.min(
  currentPage * RECORDS_PER_PAGE,
  tableData.length
);

const paginatedData = useMemo(() => {
  return tableData.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  );
}, [tableData, currentPage]);

useEffect(() => {
  const pageIDs = paginatedData.map(
    (_, i) => (currentPage - 1) * RECORDS_PER_PAGE + i
  );

  const allSelected =
    pageIDs.length > 0 &&
    pageIDs.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);
}, [paginatedData, selectedRows, currentPage]);

useEffect(() => {
  if (isBranchManager) {
    const userBranch = localStorage.getItem("branchName");
    const userCluster = localStorage.getItem("clusterName");

    if (userCluster) setCluster(userCluster);
    if (userBranch) setBranch(userBranch);
  }
}, [isBranchManager]);

const exportExcel = () => {

  logInfo("EXCEL EXPORT STARTED", {
  selectedRows: selectedRows.length,
  fileName
});

  const rowsToExport =
    selectedRows.length === 0
      ? tableData.map((row, i) => ({
          SNo: i + 1,
          ...row
        }))
      : selectedRows
          .sort((a, b) => a - b)
          .map(index => ({
            SNo: index + 1,
            ...tableData[index]
          }));

          logInfo("Calling Excel export API");
  fetch("https://mobile.coastal.bank.in:5001/api/field-visit-report/export-excel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": localStorage.getItem("userId")
    },
    body: JSON.stringify({
      columns: selectedColumns,
      data: rowsToExport
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
})
    .catch(err => {
  logError("EXCEL EXPORT ERROR", err);
});
};

  return (
    <div className="p-6 w-full">

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl p-6 shrink-0">
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
              {Array.isArray(users) && users.map(u => (
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
}}
  disabled={isBranchManager || isRegionalManager}
  className={`w-full mt-1 px-3 py-2 border rounded
  ${
    isBranchManager || isRegionalManager
      ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
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
  className={`w-full mt-1 px-3 py-2 border rounded
  ${
    isBranchManager
      ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
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

      {/* ================= SELECT ALL PAGINATION ================= */}

{tableData.length > 0 && (
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={(e) => {
        const checked = e.target.checked;
        logInfo("Select all pages toggled", checked);
        setSelectAllAllPages(checked);

        if (checked) {
          const allIDs = tableData.map((_, i) => i);
          setSelectedRows(allIDs);
        } else {
          setSelectedRows([]);
        }
      }}
    />
    Select all records from all pages
  </div>
)}

      {/* ================= TABLE ================= */}
<div className="bg-white rounded-xl border mt-6 flex flex-col overflow-hidden">

<div className="text-center py-3 font-semibold border-b">
  No. Of Records: {tableData.length}
</div>

  {/* SCROLL ONLY TABLE */}
  <div className="overflow-x-auto">

    <table className="min-w-[2200px] w-full text-sm border border-slate-300 border-collapse">

      {/* ================= TABLE HEADER ================= */}
      <thead>

  {/* GROUP HEADER ROW */}
  <tr className="text-center text-sm uppercase tracking-wide">

  <th colSpan={2} className="border bg-white"></th>

  <th
    colSpan={6}
    className="border bg-white-50 text-blue-700 font-bold py-3"
  >
    Branch Location
  </th>

  <th
    colSpan={6}
    className="border bg-white-50 text-green-700 font-bold py-3"
  >
    Customer Location
  </th>

  <th
    colSpan={4}
    className="border bg-white-50 text-purple-700 font-bold py-3"
  >
    Meeting Location
  </th>

</tr>

  {/* COLUMN HEADER ROW */}
  <tr className="bg-slate-100 text-left">

    {/* Checkbox header */}
    <th className="px-4 py-3 border text-center">
      <input
        type="checkbox"
        checked={selectAllPage}
        onChange={(e) => {
          const checked = e.target.checked;

          const pageIDs = paginatedData.map(
            (_, i) => (currentPage - 1) * RECORDS_PER_PAGE + i
          );

          if (checked) {
            setSelectedRows(prev =>
              [...new Set([...prev, ...pageIDs])]
            );
          } else {
            setSelectedRows(prev =>
              prev.filter(id => !pageIDs.includes(id))
            );
          }
        }}
      />
    </th>

    {/* S. No */}
    <th className="px-4 py-3 border font-semibold">
      S. No.
    </th>

    {/* Branch */}
    <th className="px-4 py-3 border">User Name</th>
    <th className="px-4 py-3 border">Account No</th>
    <th className="px-4 py-3 border">Customer Name</th>
    <th className="px-4 py-3 border">Branch Latitude</th>
    <th className="px-4 py-3 border">Branch Longitude</th>
    <th className="px-4 py-3 border">Meeting Date</th>

    {/* Customer */}
    <th className="px-4 py-3 border">Start Latitude</th>
    <th className="px-4 py-3 border">Start Longitude</th>
    <th className="px-4 py-3 border">Meeting Latitude</th>
    <th className="px-4 py-3 border">Meeting Longitude</th>
    <th className="px-4 py-3 border">Meeting Address</th>
    <th className="px-4 py-3 border">Distance Travelled</th>

    {/* Meeting */}
    <th className="px-4 py-3 border">Customer Latitude</th>
    <th className="px-4 py-3 border">Customer Longitude</th>
    <th className="px-4 py-3 border">Variance</th>
    <th className="px-4 py-3 border">Flow</th>

  </tr>

</thead>

      {/* ================= TABLE BODY ================= */}
      <tbody>
  {tableData.length === 0 ? (
    <tr>
      <td colSpan={18} className="text-center py-16 text-slate-400 border">
        No records found
      </td>
    </tr>
  ) : (
    paginatedData.map((row, i) => {
  const rowIndex =
    (currentPage - 1) * RECORDS_PER_PAGE + i;

  return (
    <tr
  key={rowIndex}
  className={`border-b hover:bg-slate-50 ${
    rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"
  }`}
>
      {/* Row Checkbox */}
      <td className="border px-4 text-center">
        <input
          type="checkbox"
          checked={selectedRows.includes(rowIndex)}
          onChange={(e) => {
            logInfo("Row selection changed", rowIndex);
            if (e.target.checked) {
              setSelectedRows(prev => [...prev, rowIndex]);
            } else {
              setSelectedRows(prev =>
                prev.filter(id => id !== rowIndex)
              );
            }
          }}
        />
      </td>

      {/* S.No */}
      <td className="border px-4 align-middle whitespace-nowrap">
        {rowIndex + 1}
      </td>

      <td className="border px-4 align-middle whitespace-nowrap">{row.UserName}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.AccountNo}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.CustomerName}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.BranchLatitude}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.BranchLongitude}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.MeetingDate?.split("T")[0]}
      </td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.StartLatitude}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.StartLongitude}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.MeetingLatitude}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.MeetingLongitude}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.MeetingAddress}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.DistanceTravelled}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.CustomerLatitude}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.CustomerLongitude}</td>
      <td className="border px-4 align-middle whitespace-nowrap">{row.Variance}</td>
      <td className="border px-4 whitespace-pre-line break-words min-w-[250px] max-w-[400px] align-middle">
  {row.Flow}
</td>

    </tr>
  );
})
  )}
</tbody>
    </table>
</div>

{/* PAGINATION (OUTSIDE SCROLL) */}
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
    <div className="bg-white w-[600px] rounded-xl shadow-lg p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Export Grid</h2>
        <button onClick={() => setShowExport(false)}>✖</button>
      </div>

      {/* FILENAME */}
      <div className="mb-4">
        <label className="text-sm text-slate-600">Filename</label>
        <input
  value={fileName}
  onChange={(e) => setFileName(e.target.value)}
  className="w-full mt-1 px-3 py-2 border rounded bg-white"
/>
      </div>

      {/* COLUMN LIST */}
      <div className="max-h-[300px] overflow-y-auto border rounded">
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

      {/* FOOTER */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          className="px-4 py-2 bg-slate-200 rounded"
          onClick={() => setShowExport(false)}
        >
          Cancel
        </button>

        <div className="flex gap-3">

<button
  className="px-4 py-2 bg-green-600 text-white rounded"
  onClick={() => exportExcel()}
>
  Export Excel
</button>

<button
  className="px-4 py-2 bg-primary text-white rounded"
  onClick={() => exportPDF()}
>
  Export PDF
</button>

</div>
      </div>

    </div>
  </div>
)}

    </div>
  );
};

export default FieldVisitReport;
