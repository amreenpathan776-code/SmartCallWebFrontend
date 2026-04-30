import { useEffect, useState } from "react";
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

const CashCollectionReport = () => {

  useEffect(() => {
  logInfo("CASH COLLECTION PAGE LOADED", {
    role: localStorage.getItem("role"),
    userId: localStorage.getItem("userId")
  });
}, []);

  const RECORDS_PER_PAGE = 15;

const [currentPage, setCurrentPage] = useState(1);
const [selectedRows, setSelectedRows] = useState([]);
const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [data, setData] = useState([]);

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

  logInfo("RM Effect Triggered", { isRegionalManager, rmCluster });
  if (isRegionalManager && rmCluster) {
  logInfo("Regional Manager flow triggered", rmCluster);

    setFilters(prev => {
  const updated = { ...prev, cluster: rmCluster };
  logInfo("RM cluster set in filters", updated);
  return updated;
});

    logInfo("Fetching branches for RM", rmCluster);
    axios
      .get(`https://mobile.coastal.bank.in:5001/api/branches/${rmCluster}`)
      .then(res => {
  logSuccess("RM Branches fetched", res.data);
  setBranches(res.data);
})
      .catch(err => {
  logError("RM Branch fetch error", err);
  setBranches([]);
});

  }

}, [isRegionalManager, rmCluster]);

  const ALL_COLUMNS = [
  "serialNumber",
  "employeeId",
  "userName",
  "branchName",
  "accountNumber",
  "customerName",
  "collectionDate",
  "amountCollected"
];

const [showExportModal, setShowExportModal] = useState(false);
const [exportFileName, setExportFileName] = useState("Cash_Collection_Report");
const [selectedColumns, setSelectedColumns] = useState(ALL_COLUMNS);


  const [filters, setFilters] = useState({
    user: "",
    fromDate: "",
    toDate: "",
    cluster: "",
    branch: ""
  });

  // ================= LOAD CLUSTERS =================
  useEffect(() => {
    logInfo("Fetching clusters API");
    axios.get("https://mobile.coastal.bank.in:5001/api/clusters")
      .then(res => {
  logSuccess("Clusters fetched", res.data);
        setClusters([
          { cluster_name: "Corporate Office" }, // ✅ Added manually
          ...res.data
        ]);
      })
      .catch(err => {
  logError("Clusters fetch error", err);
});
  }, []);

  // ================= LOAD BRANCHES BASED ON CLUSTER =================
  useEffect(() => {
    logInfo("Cluster changed → loading branches", filters.cluster);
  if (!filters.cluster) return;

  axios.get(`https://mobile.coastal.bank.in:5001/api/branches/${filters.cluster}`)
    .then(res => {
  logSuccess("Branches loaded", res.data);
      setBranches(res.data);

      // ❗ Only reset branch if NOT Branch Manager
      if (!isBranchManager) {
        setFilters(prev => ({ ...prev, branch: "", user: "" }));
      }
    })
    .catch(err => {
  logError("Branch load error", err);
});

}, [filters.cluster, isBranchManager]);

  // ================= LOAD USERS BASED ON CLUSTER + BRANCH =================
  useEffect(() => {
logInfo("Loading users", {
  cluster: filters.cluster,
  branch: filters.branch
});
  if (!filters.cluster) return;

  axios.post(
    "https://mobile.coastal.bank.in:5001/api/assignUsers/v2",
    {
      cluster: filters.cluster,
      branchName: filters.branch
    },
    {
      headers: {
        "x-user-id": localStorage.getItem("userId")
      }
    }
  )
    .then(res => {
  logSuccess("Users loaded", res.data);
      setUsers(res.data);

      if (!isBranchManager) {
        setFilters(prev => ({ ...prev, user: "" }));
      }
    })
    .catch(err => {
  logError("Users load error", err);
});

}, [filters.cluster, filters.branch, isBranchManager]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
  logInfo("Filter changed", {
    name: e.target.name,
    value: e.target.value
  });

  setFilters({ ...filters, [e.target.name]: e.target.value });
};

  // ================= SEARCH =================
const handleSearch = async () => {

  logInfo("CASH COLLECTION SEARCH STARTED", filters);
  // ✅ Check if at least one filter is selected
  const hasAnyFilter = Object.values(filters)
    .some(value => value && value.toString().trim() !== "");

  if (!hasAnyFilter) {
    logWarn("Search blocked - no filters");
    alert("Please select at least one filter before searching.");
    return;   // 🚫 Stop API call
  }

  try {
    logInfo("Calling Cash Collection Search API");
    const res = await axios.post(
  "https://mobile.coastal.bank.in:5001/api/cash-collection-report/search",
  filters,
  {
    headers: {
      "x-user-id": localStorage.getItem("userId")
    }
  }
);

    setData(res.data || []);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAllPage(false);
    setSelectAllAllPages(false);

    logSuccess("CASH COLLECTION SEARCH SUCCESS", {
  count: res.data?.length || 0
});

    if (!res.data || res.data.length === 0) {
  logWarn("No records found");
}

  } catch (err) {
    logError("CASH COLLECTION SEARCH FAILED", err);
  }
};

  // ================= RESET =================
  const handleReset = () => {

logWarn("RESET TRIGGERED");

  if (isBranchManager) {

    setFilters({
      user: "",
      fromDate: "",
      toDate: "",
      cluster: userCluster,
      branch: userBranch
    });

  }
  else if (isRegionalManager) {

    setFilters({
      user: "",
      fromDate: "",
      toDate: "",
      cluster: rmCluster,
      branch: ""
    });

  }
  else {

    setFilters({
      user: "",
      fromDate: "",
      toDate: "",
      cluster: "",
      branch: ""
    });

  }

  setData([]);
  setUsers([]);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);
  logSuccess("RESET COMPLETED");
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

const handleExportPDF = async () => {

  logInfo("EXPORT PDF STARTED", {
  selectedRows,
  selectedColumns,
  exportFileName
});

  if (selectedColumns.length === 0) {
    alert("Select at least one column");
    return;
  }

  try {

    const indexesToExport =
      selectedRows.length === 0
        ? data.map((_, i) => i)   // export ALL
        : selectedRows;           // export selected

        logInfo("Calling Export PDF API");
    const response = await axios.post(
  "https://mobile.coastal.bank.in:5001/api/cash-collection-report/export-pdf",
  {
    selectedIndexes: indexesToExport,
    columns: selectedColumns,
    fileName: exportFileName,
    fullData: data
  },
  {
    headers: {
      "x-user-id": localStorage.getItem("userId")
    },
    responseType: "blob"
  }
);

    const url = window.URL.createObjectURL(new Blob([response.data]));

    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.pdf`;
    link.click();
    logSuccess("PDF EXPORTED SUCCESSFULLY");

    setShowExportModal(false);

  } catch (err) {
  logError("PDF EXPORT FAILED", err);
  alert("Failed to export PDF");
}
};

useEffect(() => {
  if (isBranchManager && userCluster && userBranch) {
    setFilters(prev => ({
      ...prev,
      cluster: userCluster,
      branch: userBranch
    }));
  }
}, [isBranchManager, userCluster, userBranch]);

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl p-6 shrink-0">
        <div className="grid grid-cols-5 gap-6">

          {/* USER */}
          <div>
            <label className="text-sm text-slate-600">User</label>
            <select
              name="user"
              value={filters.user}
              onChange={handleChange}
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

          {/* FROM DATE */}
          <div>
            <label className="text-sm text-slate-600">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* TO DATE */}
          <div>
            <label className="text-sm text-slate-600">To Date</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* CLUSTER */}
          <div>
            <label className="text-sm text-slate-600">Cluster</label>
            <select
  name="cluster"
  value={filters.cluster}
  onChange={handleChange}
  disabled={isBranchManager || isRegionalManager}
  className={`w-full mt-1 px-3 py-2 border rounded
  ${
    isBranchManager || isRegionalManager
      ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
      : "bg-slate-100"
  }`}
>
              <option value="">Select</option>
              {clusters.map((c, index) => (
                <option key={index} value={c.cluster_name}>
                  {c.cluster_name}
                </option>
              ))}
            </select>
          </div>

          {/* BRANCH */}
          <div>
            <label className="text-sm text-slate-600">Branch</label>
            <select
  name="branch"
  value={filters.branch}
  onChange={handleChange}
  disabled={!filters.cluster || isBranchManager}
  className={`w-full mt-1 px-3 py-2 border rounded
  ${
    isBranchManager
      ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
      : "bg-slate-100"
  }`}
>
              <option value="">Select</option>
              {branches.map(b => (
                <option key={b.branch_code} value={b.branch_name}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={handleSearch} className="px-6 py-2 bg-primary text-white rounded">
            Search
          </button>
          <button onClick={handleReset} className="px-6 py-2 bg-slate-200 rounded">
            Reset
          </button>

          <button
  disabled={data.length === 0}
  onClick={() => setShowExportModal(true)}
  className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
>
  Export Data
</button>

          {/* ================= SELECT ALL RECORDS ================= */}
      {data.length > 0 && (
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={(e) => {
        const checked = e.target.checked;
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

      {/* ================= TABLE ================= */}
<div className="bg-white rounded-xl border mt-6 flex flex-col flex-1 overflow-hidden">

  {/* Record Count */}
  <div className="text-center py-3 font-semibold border-b">
    No. Of Records: {data.length}
  </div>

  <div className="flex-1 overflow-auto">
          <table className="min-w-[1600px] w-full text-sm border-collapse">
  <thead className="bg-slate-100 sticky top-0">
    <tr>

      {/* Select All Page */}
      <th className="px-4 py-4 border text-center">
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

      <th className="px-4 py-4 border">S. No.</th>

      {[
        "Employee Id",
        "User Name",
        "Branch Name",
        "Account Number",
        "Customer Name",
        "Collection Date",
        "Amount Collected",
      ].map(col => (
        <th key={col} className="px-6 py-4 border text-left font-semibold whitespace-nowrap">
          {col}
        </th>
      ))}
    </tr>
  </thead>

  <tbody>
    {currentRecords.length === 0 ? (
      <tr>
        <td colSpan={9} className="text-center py-16 text-slate-400 border">
          No records found
        </td>
      </tr>
    ) : (
      currentRecords.map((row, index) => {
        const globalIndex = indexOfFirstRecord + index;

        return (
          <tr key={globalIndex}>
            <td className="border px-4 py-2 text-center">
              <input
                type="checkbox"
                checked={selectedRows.includes(globalIndex)}
                onChange={(e) => {
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

            <td className="border px-4 py-2">
              {globalIndex + 1}
            </td>

            <td className="border px-4 py-2">{row.employeeId}</td>
            <td className="border px-4 py-2">{row.userName}</td>
            <td className="border px-4 py-2">{row.branchName}</td>
            <td className="border px-4 py-2">{row.accountNumber}</td>
            <td className="border px-4 py-2">{row.customerName}</td>
            <td className="border px-4 py-2">{row.collectionDate}</td>
            <td className="border px-4 py-2">{row.amountCollected}</td>
          </tr>
        );
      })
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

{showExportModal && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div className="bg-white w-[500px] p-6 rounded-xl">

      <h2 className="text-lg font-semibold mb-4">Export Grid</h2>

      <label className="text-sm">File Name</label>
      <input
        className="w-full border px-3 py-2 mt-1 mb-4"
        value={exportFileName}
        onChange={(e) => setExportFileName(e.target.value)}
      />

      <div className="max-h-60 overflow-y-auto space-y-2">
        {ALL_COLUMNS.map(col => (
          <label key={col} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedColumns.includes(col)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedColumns(prev => [...prev, col]);
                } else {
                  setSelectedColumns(prev =>
                    prev.filter(c => c !== col)
                  );
                }
              }}
            />
            {col}
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-4 mt-6">
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
          Download PDF
        </button>
      </div>

    </div>
  </div>
)}
      </div>

    </div>
  );
};

export default CashCollectionReport;
