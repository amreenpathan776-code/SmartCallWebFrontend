import { useEffect, useState, useCallback } from "react";
import axios from "axios";

// ================= LOGGER =================
const getUserId = () => localStorage.getItem("userId") || "Unknown";

const logInfo = (msg, data) =>
  console.log(`📡 [User:${getUserId()}] ${msg}`, data || "");

const logSuccess = (msg, data) =>
  console.log(`✅ [User:${getUserId()}] ${msg}`, data || "");

const logError = (msg, data) =>
  console.error(`❌ [User:${getUserId()}] ${msg}`, data || "");

const logWarn = (msg, data) =>
  console.warn(`⚠️ [User:${getUserId()}] ${msg}`, data || "");

const AssignmentSummary = () => {

  const [filters, setFilters] = useState({
    userName: "",
    cluster: "",
    branch: "",
    fromDate: "",
    toDate: "",
  });

  const [users, setUsers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState([]);

  const RECORDS_PER_PAGE = 15;

const [currentPage, setCurrentPage] = useState(1);
const [selectedRows, setSelectedRows] = useState([]);
const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

const role = localStorage.getItem("role");
const userBranch = localStorage.getItem("branchName");
const userCluster = localStorage.getItem("clusterName");

const isBranchManager = role === "Branch Manager";
const isRegionalManager = role?.startsWith("Regional Manager");

let rmCluster = "";

if (isRegionalManager) {
  const match = role.match(/\((.*?)\)/);
  rmCluster = match ? match[1] : "";
}

useEffect(() => {
  logInfo("ASSIGNMENT SUMMARY PAGE LOADED", {
    role: localStorage.getItem("role"),
    userId: localStorage.getItem("userId")
  });
}, []);

useEffect(() => {
logInfo("RM Effect Triggered", { isRegionalManager, rmCluster });
  if (isRegionalManager && rmCluster) {
logInfo("Regional Manager flow triggered", rmCluster);
    setFilters(prev => ({
      ...prev,
      cluster: rmCluster
    }));

    logInfo("Fetching branches for RM", rmCluster);
    axios
      .get(`https://mobile.coastal.bank.in:5001/api/branches/${rmCluster}`)
      .then(res => {
        logSuccess("RM Branches fetched", res.data);
        setBranches(res.data.map(x => x.branch_name));
      })
      .catch((err) => {
  logError("RM Branch fetch error", err);
  setBranches([]);
});

  }

}, [isRegionalManager, rmCluster]);


  // ===========================
  // INITIAL LOAD
  // ===========================

useEffect(() => {
  loadClusters();
}, []);

  // ===========================
  // LOAD CLUSTERS
  // ===========================
  const loadClusters = async () => {
    logInfo("Fetching clusters API");
try {
  const res = await axios.get(
    "https://mobile.coastal.bank.in:5001/api/clusters"
  );

  logSuccess("Clusters fetched", res.data);

      const clusterList = res.data.map((x) => x.cluster_name);
      setClusters(["Corporate Office", ...clusterList]);

    } catch (err) {
      logError("Error loading clusters", err);
    }
  };


  // ===========================
  // LOAD USERS
  // ===========================
 const loadUsers = useCallback(async () => {

  logInfo("Loading users", {
  cluster: filters.cluster,
  branch: filters.branch
});

  if (!filters.cluster) {
  logWarn("Users load skipped - cluster not selected");
  return;
}

  try {

    logInfo("Calling Users API");
    const res = await axios.post(
  "https://mobile.coastal.bank.in:5001/api/users/list",
  {
    page: 1,
    pageSize: 1000,
    cluster:
      filters.cluster === "Corporate Office"
        ? ""
        : filters.cluster || "",
    branch: filters.branch || "",
    name: "",
    status: "Active"   // ✅ IMPORTANT
  },
  {
    headers: {
      "x-user-role": localStorage.getItem("role"),
      "x-user-branch": localStorage.getItem("branchName"),
      "x-user-cluster": localStorage.getItem("clusterName")
    }
  }
);

    const uniqueUsers = [
  ...new Map(
    res.data.records.map(u => [u.userId, u])
  ).values()
];

// ✅ FILTER CORPORATE OFFICE USERS
const filteredUsers = uniqueUsers.filter(
  (u) => u.branchName !== "Corporate Office"
);
logSuccess("Users loaded", res.data);
setUsers(filteredUsers);

  } catch (err) {
    logError("Users load error", err);
  }

}, [filters.cluster, filters.branch]);

  useEffect(() => {

  const handleClusterChange = async () => {
logInfo("Cluster changed", filters.cluster);
    // 🔹 Nothing selected
    if (!filters.cluster) {
      setBranches([]);
      setUsers([]);
      return;
    }

    try {
      logInfo("Fetching branches for selected cluster", filters.cluster);
      // 🔥 Always call same API
      const res = await axios.get(
        `https://mobile.coastal.bank.in:5001/api/branches/${filters.cluster}`
      );

      logSuccess("Branches loaded", res.data);
      setBranches(res.data.map(x => x.branch_name));

    } catch (err) {
  logError("Branch load error", err);
}

    // 🔹 Reset branch & user
    if (!isBranchManager) {
  setFilters(prev => ({
    ...prev,
    branch: "",
    userName: ""
  }));
}
  };

  handleClusterChange();

}, [filters.cluster, isBranchManager]);

  // ===========================
  // WHEN CLUSTER OR BRANCH CHANGES
  // ===========================
useEffect(() => {

  if (!filters.cluster) return;

  loadUsers();

}, [filters.cluster, filters.branch, loadUsers]);
  // ===========================
  // SEARCH
  // ===========================
  const handleSearch = async () => {

    logInfo("ASSIGNMENT SUMMARY SEARCH STARTED", filters);

  const hasAnyFilter = Object.values(filters)
    .some(value => value && value.toString().trim() !== "");

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching.");
    logWarn("Search blocked - no filters");
    return; // 🚫 STOP
  }

  try {
    logInfo("Calling Assignment Summary Search API");
    const res = await axios.post(
  "https://mobile.coastal.bank.in:5001/api/assignment-summary/search",
  filters,
  {
    headers: {
      "x-user-role": localStorage.getItem("role"),
      "x-user-branch": localStorage.getItem("branchName"),
      "x-user-cluster": localStorage.getItem("clusterName")
    }
  }
);

    setData(res.data || []);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAllPage(false);
    setSelectAllAllPages(false);

    logSuccess("SEARCH SUCCESS", {
  count: res.data?.length || 0
});

  } catch (err) {
  logError("SEARCH FAILED", err);
}
};

  // ===========================
  // RESET
  // ===========================
  const handleReset = () => {

    logWarn("RESET TRIGGERED");
  if (isBranchManager) {

    setFilters({
      userName: "",
      cluster: userCluster,
      branch: userBranch,
      fromDate: "",
      toDate: ""
    });

  }
  else if (isRegionalManager) {

    setFilters({
      userName: "",
      cluster: rmCluster,
      branch: "",
      fromDate: "",
      toDate: ""
    });

  }
  else {

    setFilters({
      userName: "",
      cluster: "",
      branch: "",
      fromDate: "",
      toDate: ""
    });

    setBranches([]);
    setUsers([]);

  }

  setData([]);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);
  logSuccess("RESET COMPLETED");
};

  const formatDPD = (value) => {
  if (!value) return "";
  if (value === "01") return "0-30 Days";
  if (value === "02") return "31-60 Days";
  if (value === "03") return "61-90 Days";
  if (parseInt(value) >= 4) return "Above 90 Days";
  return value;
};

const totalPages = Math.max(
  1,
  Math.ceil(data.length / RECORDS_PER_PAGE)
);

const indexOfLastRecord = currentPage * RECORDS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - RECORDS_PER_PAGE;

const currentRecords = data.slice(
  indexOfFirstRecord,
  indexOfLastRecord
);

const firstRecord = data.length === 0 ? 0 : indexOfFirstRecord + 1;
const lastRecord = Math.min(indexOfLastRecord, data.length);

useEffect(() => {
  const pageIndexes = currentRecords.map(
    (_, i) => indexOfFirstRecord + i
  );

  const allSelected =
    pageIndexes.length > 0 &&
    pageIndexes.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);

}, [currentPage, selectedRows, currentRecords, indexOfFirstRecord]);

useEffect(() => {

  if (isBranchManager && userCluster && userBranch) {
    setFilters(prev => ({
      ...prev,
      cluster: userCluster,
      branch: userBranch
    }));
  }

}, [isBranchManager, userCluster, userBranch]);


const [showExportModal, setShowExportModal] = useState(false);
const [pdfFileName, setPdfFileName] = useState("Assignment_Summary_Report");

const allColumns = [
  { key: "serialNumber", label: "S. No." },
  { key: "AssignedByUserId", label: "Assigned By User ID" },
  { key: "AssignedByUserName", label: "Assigned By User Name" },
  { key: "AssignedToUserId", label: "Assigned To User ID" },
  { key: "AssignedToUserName", label: "Assigned To User Name" },
  { key: "BranchCode", label: "Branch Code" },
  { key: "BranchName", label: "Branch Name" },
  { key: "AccountCount", label: "No. of Accounts Assigned" }
];

const [selectedColumns, setSelectedColumns] = useState(
  allColumns.map(col => col.key)
);

const handleExportPDF = async () => {

  logInfo("EXPORT PDF STARTED", {
  selectedRows,
  selectedColumns,
  pdfFileName
});

  if (selectedColumns.length === 0) {
    alert("Please select at least one column.");
    return;
  }

  try {

    const recordsToExport =
      selectedRows.length === 0
        ? data.map((row, i) => ({
            ...row,
            serialNumber: i + 1
          }))                       // Export ALL search results
        : selectedRows.map(index => ({
            ...data[index],
            serialNumber: index + 1
          }));                      // Export selected rows

          logInfo("Calling Export PDF API");
    const res = await axios.post(
      "https://mobile.coastal.bank.in:5001/api/assignment-summary/export-pdf",
      {
        records: recordsToExport,
        columns: selectedColumns,
        fileName: pdfFileName
      },
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));

    const link = document.createElement("a");
    link.href = url;
    link.download = `${pdfFileName}.pdf`;
    link.click();
    logSuccess("PDF EXPORTED SUCCESSFULLY");

    setShowExportModal(false);

  } catch (err) {
  logError("PDF EXPORT FAILED", err);
}
};

const [showDetailsModal, setShowDetailsModal] = useState(false);
const [detailsData, setDetailsData] = useState([]);

const openDetails = (row) => {

  logInfo("View Details clicked", row);

setDetailsData(row.accounts || []);

setShowDetailsModal(true);

};

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">

      {/* FILTERS */}
      <div className="bg-white rounded-xl p-6 shrink-0">
        <div className="grid grid-cols-5 gap-6">

          {/* USER */}
          <div>
            <label className="text-sm text-slate-600">User</label>
            <select
              value={filters.userName}
              onChange={(e) => {
  logInfo("Filter changed", {
    field: "userName",
    value: e.target.value
  });
  setFilters({ ...filters, userName: e.target.value });
}}
              
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {users.map((u) => (
  <option key={u.userId} value={u.userName}>
    {u.userName}
  </option>
))}
            </select>
          </div>

          {/* FROM DATE */}
          <div>
            <label className="text-sm text-slate-600">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => {
  logInfo("Filter changed", {
    field: "fromDate",
    value: e.target.value
  });
  setFilters({ ...filters, fromDate: e.target.value });
}}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* TO DATE */}
          <div>
            <label className="text-sm text-slate-600">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => {
  logInfo("Filter changed", {
    field: "toDate",
    value: e.target.value
  });
  setFilters({ ...filters, toDate: e.target.value });
}}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* CLUSTER */}
          <div>
            <label className="text-sm text-slate-600">Cluster</label>
            <select
  value={filters.cluster}
  disabled={isBranchManager || isRegionalManager}
  onChange={(e) => {
  logInfo("Filter changed", {
    field: "cluster",
    value: e.target.value
  });
  setFilters({ ...filters, cluster: e.target.value });
}}
  className={`w-full mt-1 px-3 py-2 border rounded
  ${
    isBranchManager || isRegionalManager
      ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
      : "bg-slate-100"
  }`}
>
              <option value="">Select</option>
              {clusters.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* BRANCH */}
          <div>
            <label className="text-sm text-slate-600">Branch</label>
            <select
  disabled={!filters.cluster || isBranchManager}
  value={filters.branch}
  onChange={(e) => {
  logInfo("Filter changed", {
    field: "branch",
    value: e.target.value
  });
  setFilters({ ...filters, branch: e.target.value });
}}
  className={`w-full mt-1 px-3 py-2 border rounded
  ${
    isBranchManager
      ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
      : "bg-slate-100"
  }`}
>
              <option value="">Select</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary text-white rounded"
          >
            Search
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-slate-200 rounded"
          >
            Reset
          </button>
          <button
  disabled={data.length === 0}
  onClick={() => setShowExportModal(true)}
  className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
>
  Export Data
</button>

{/* SELECT ALL RECORDS */}
          {data.length > 0 && (
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={(e) => {
        const checked = e.target.checked;
        logInfo("Select All (All Pages) toggled", { checked });
        setSelectAllAllPages(checked);

        if (checked) {
          const allIndexes = data.map((_, i) => i);
          setSelectedRows(allIndexes);
        } else {
          setSelectedRows([]);
        }
      }}
    />
    Select all records from all pages
  </div>
)}
        </div>
      </div>

      {/* TABLE */}
<div className="bg-white rounded-xl border mt-6 flex flex-col flex-1 overflow-hidden">

  {/* Header Title */}
  <div className="text-center py-3 font-semibold border-b">
  No. Of Records: {data.length}
</div>

  {/* Scroll Area */}
  <div className="flex-1 overflow-x-auto overflow-y-auto">
    <table className="w-full text-sm border-collapse">

      <thead className="bg-gray-100">
<tr>

<th className="px-3 py-2 border text-center w-[40px]">
<input
type="checkbox"
checked={selectAllPage}
onChange={(e) => {
const checked = e.target.checked;

const pageIndexes = currentRecords.map(
(_, i) => indexOfFirstRecord + i
);

if (checked) {
setSelectedRows(prev =>
[...new Set([...prev, ...pageIndexes])]
);
} else {
setSelectedRows(prev =>
prev.filter(id => !pageIndexes.includes(id))
);
}
}}
/>
</th>

<th className="px-3 py-2 border text-left">S. No.</th>
<th className="px-3 py-2 border text-left">Assigned By User ID</th>
<th className="px-3 py-2 border text-left">Assigned By User Name</th>
<th className="px-3 py-2 border text-left">Assigned To User ID</th>
<th className="px-3 py-2 border text-left">Assigned To User Name</th>
<th className="px-3 py-2 border text-left">Branch Code</th>
<th className="px-3 py-2 border text-left">Branch Name</th>
<th className="px-3 py-2 border text-left">No. of Accounts Assigned</th>
<th className="px-3 py-2 border text-center">Action</th>

</tr>
</thead>

      <tbody>
{currentRecords.length > 0 ? (
currentRecords.map((row, index) => {

const globalIndex = indexOfFirstRecord + index;

return (
<tr key={globalIndex} className="hover:bg-gray-50">

<td className="px-3 py-2 border text-center">
<input
type="checkbox"
checked={selectedRows.includes(globalIndex)}
onChange={(e) => {
  logInfo("Row selection changed", {
  index: globalIndex,
  checked: e.target.checked
});
if (e.target.checked) {
setSelectedRows(prev => [...prev, globalIndex]);
} else {
setSelectedRows(prev =>
prev.filter(id => id !== globalIndex)
);
}
}}
/>
</td>

<td className="px-4 py-3 border">{globalIndex + 1}</td>

<td className="px-3 py-2 border">{row.AssignedByUserId}</td>
<td className="px-3 py-2 border">{row.AssignedByUserName}</td>
<td className="px-3 py-2 border">{row.AssignedToUserId}</td>
<td className="px-3 py-2 border">{row.AssignedToUserName}</td>
<td className="px-3 py-2 border">{row.BranchCode}</td>
<td className="px-3 py-2 border">{row.BranchName}</td>
<td className="px-3 py-2 border">{row.AccountCount}</td>

<td className="px-3 py-2 border text-center">
<button
onClick={() => openDetails(row)}
className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
>
View Details
</button>
</td>

</tr>
);
})
) : (
<tr>
<td colSpan={10} className="text-center py-16 text-slate-400 border">
No records found
</td>
</tr>
)}
</tbody>

    </table>
  </div>

{/* PAGINATION */}
{data.length > 0 && (
  <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50 text-sm text-slate-600">

  {/* Showing Records */}
  <div>
    Showing {firstRecord}-{lastRecord} of {data.length}
  </div>

  {/* Pagination Controls */}
  <div className="flex items-center gap-2">

    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(1)}
      className="px-2 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
    >
      ⏮
    </button>

    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => p - 1)}
      className="px-2 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
    >
      ◀
    </button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(p => p + 1)}
      className="px-2 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
    >
      ▶
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(totalPages)}
      className="px-2 py-1 border rounded hover:bg-slate-100 disabled:opacity-50"
    >
      ⏭
    </button>

  </div>

</div>
)}
</div>

{showExportModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg w-[500px]">
      <h2 className="text-lg font-semibold mb-4">Select Fields for PDF</h2>

      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {allColumns.map(col => (
          <label key={col.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedColumns.includes(col.key)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedColumns(prev => [...prev, col.key]);
                } else {
                  setSelectedColumns(prev =>
                    prev.filter(c => c !== col.key)
                  );
                }
              }}
            />
            {col.label}
          </label>
        ))}
      </div>

      <div className="mt-4">
        <label className="text-sm">PDF File Name</label>
        <input
          type="text"
          value={pdfFileName}
          onChange={(e) => setPdfFileName(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowExportModal(false)}
          className="px-4 py-2 bg-slate-200 rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Generate PDF
        </button>
      </div>
    </div>
  </div>
)}

{showDetailsModal && (
<div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">

<div className="bg-white p-6 rounded-lg w-[900px] max-h-[80vh] overflow-y-auto">

<h2 className="text-lg font-semibold mb-4">Account Details</h2>

<table className="w-full border text-sm">

<thead className="bg-gray-100">
<tr>
<th className="border px-4 py-2">S. No.</th>
<th className="border px-4 py-2">Account No.</th>
<th className="border px-4 py-2">Customer Name</th>
<th className="border px-4 py-2">DPD Queue</th>
<th className="border px-4 py-2">No. of Calls</th>
</tr>
</thead>

<tbody>

{detailsData.length > 0 ? (
detailsData.map((acc, i) => (
<tr key={i}>
<td className="border px-4 py-2">{i + 1}</td>
<td className="border px-4 py-2">{acc.AccountNumber}</td>
<td className="border px-4 py-2">{acc.CustomerName}</td>
<td className="border px-4 py-2">{formatDPD(acc.DpdQueue)}</td>
<td className="border px-4 py-2">{acc.NoOfCalls}</td>
</tr>
))
) : (
<tr>
<td colSpan="5" className="text-center py-6">
No accounts found
</td>
</tr>
)}

</tbody>

</table>

<div className="flex justify-end mt-4">
<button
onClick={() => setShowDetailsModal(false)}
className="px-4 py-2 bg-slate-200 rounded"
>
Close
</button>
</div>

</div>
</div>
)}

    </div>
  );
};

export default AssignmentSummary;