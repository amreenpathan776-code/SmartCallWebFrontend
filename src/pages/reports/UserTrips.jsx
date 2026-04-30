import { useEffect, useState } from "react";

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

const UserTrips = () => {

  useEffect(() => {
  logInfo("USER TRIPS PAGE LOADED", {
    role: localStorage.getItem("role"),
    userId: localStorage.getItem("userId")
  });
}, []);

  // ================= STATE =================
  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);

  const [cluster, setCluster] = useState("");
  const [branch, setBranch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

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
logInfo("RM Effect Triggered", { isRegionalManager, rmCluster });
  if (isRegionalManager && rmCluster) {
logInfo("Regional Manager flow triggered", rmCluster);
    setCluster(rmCluster);

    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(rmCluster)}`)
      .then(res => res.json())
      .then(data => {
  logSuccess("RM Branches fetched", data);
  setBranches(data || []);
})
      .catch((err) => {
  logError("RM Branch fetch error", err);
  setBranches([]);
});

  }

}, [isRegionalManager, rmCluster]);

const [showExportModal, setShowExportModal] = useState(false);
const [exportFileName, setExportFileName] = useState("User_Trips_Report");

const [selectedColumns, setSelectedColumns] = useState([
  "serialNumber",
  "UserName",
  "UserId",
  "MemberName",
  "AccountNumber",
  "BranchName",
  "MonthYear",
  "VisitDate",
  "TotalDistance",
  "DistanceTravelled",
  "StartLocation",
  "EndLocation"
]);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;


  // ================= LOAD CLUSTERS =================
  useEffect(() => {
    logInfo("Fetching clusters API");
  fetch("https://mobile.coastal.bank.in:5001/api/clusters")
    .then(res => res.json())
    .then(data => {
  logSuccess("Clusters fetched", data);
      setClusters([
        { cluster_name: "Corporate Office" },
        ...data
      ]);
    })
    .catch((err) => {
  logError("Cluster fetch error", err);
});
}, []);

  // ================= CLUSTER CHANGE =================
  useEffect(() => {

  const loadBranchData = async () => {
    logInfo("Cluster changed", cluster);

    if (!cluster) {
      setBranches([]);
      if (!isBranchManager) {
        setBranch("");
      }
      return;
    }

    try {
      logInfo("Fetching branches for cluster", cluster);
      const res = await fetch(
        `https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(cluster)}`
      );

      const data = await res.json();
      if (!res.ok) {
  logError("User Trips API returned error status", res.status);
}
      logSuccess("Branches loaded", data);
      setBranches(data || []);

      // 🔒 Only clear branch if NOT Branch Manager
      if (!isBranchManager) {
        setBranch("");
      }

    } catch (err) {
  logError("Branch load error", err);
    }
  };

  loadBranchData();

}, [cluster, isBranchManager]);

  // ================= SEARCH =================
  const handleSearch = async () => {

    logInfo("USER TRIPS SEARCH STARTED", {
  cluster,
  branch,
  fromDate,
  toDate
});

  const hasAnyFilter =
    cluster ||
    branch ||
    fromDate ||
    toDate;

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching.");
    logWarn("Search blocked - no filters");
    return; // 🚫 STOP SEARCH
  }
logInfo("Calling User Trips API");
  setLoading(true);

  try {
    const res = await fetch("https://mobile.coastal.bank.in:5001/api/user-trips", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-user-role": localStorage.getItem("role"),
    "x-user-branch": localStorage.getItem("branchName"),
    "x-user-cluster": localStorage.getItem("clusterName")
  },
  body: JSON.stringify({
    cluster,
    branch,
    fromDate,
    toDate
  })
});

    const data = await res.json();

    setTrips(data || []);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAllPage(false);
    setSelectAllAllPages(false);
    logSuccess("SEARCH SUCCESS", {
  count: data?.length || 0
});

  } catch (err) {
  logError("SEARCH FAILED", err);
  } finally {
    setLoading(false);
  }
};

  // ================= RESET =================
  const handleReset = () => {

    logWarn("RESET TRIGGERED");

  if (isBranchManager) {

  setCluster(userCluster);
  setBranch(userBranch);

}
else if (isRegionalManager) {

  setCluster(rmCluster);
  setBranch("");

}
else {

  setCluster("");
  setBranch("");

}

  setFromDate("");
  setToDate("");
  setTrips([]);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);
  logSuccess("RESET COMPLETED");
};

const indexOfLastRecord = currentPage * recordsPerPage;
const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

const currentTrips = trips.slice(indexOfFirstRecord, indexOfLastRecord);

const totalPages = Math.ceil(trips.length / recordsPerPage);

const firstRecord = trips.length === 0 ? 0 : indexOfFirstRecord + 1;
const lastRecord = Math.min(indexOfLastRecord, trips.length);

useEffect(() => {
  const pageIndexes = currentTrips.map(
    (_, i) => indexOfFirstRecord + i
  );

  const allSelected =
    pageIndexes.length > 0 &&
    pageIndexes.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);

}, [currentPage, selectedRows, currentTrips, indexOfFirstRecord]);

const handleExportPDF = async () => {
  logInfo("EXPORT PDF STARTED", {
  selectedRows,
  selectedColumns,
  exportFileName
});

  if (selectedColumns.length === 0) {
    alert("Please select at least one column");
    return;
  }

  try {

    const indexesToExport =
      selectedRows.length === 0
        ? trips.map((_, i) => i)   // export ALL results
        : selectedRows;            // export selected rows

logInfo("Calling Export PDF API");
    const response = await fetch(
      "https://mobile.coastal.bank.in:5001/api/user-trips/export-pdf",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIndexes: indexesToExport,
          columns: selectedColumns,
          fileName: exportFileName,
          fullData: trips
        })
      }
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.pdf`;
    link.click();
logSuccess("PDF EXPORTED SUCCESSFULLY");
    setShowExportModal(false);
    

  } catch (err) {
  logError("PDF EXPORT FAILED", err);
  alert("PDF export failed");
  }
};

useEffect(() => {
  if (isBranchManager && userCluster && userBranch) {
    setCluster(userCluster);
    setBranch(userBranch);
  }
}, [isBranchManager, userCluster, userBranch]);


const handleExportExcel = async () => {

  logInfo("EXPORT EXCEL STARTED", {
  selectedRows,
  selectedColumns,
  exportFileName
});

  if (selectedColumns.length === 0) {
    alert("Please select at least one column");
    return;
  }

  try {

    const indexesToExport =
      selectedRows.length === 0
        ? trips.map((_, i) => i)
        : selectedRows;

        logInfo("Calling Export Excel API");
    const response = await fetch(
      "https://mobile.coastal.bank.in:5001/api/user-trips/export-excel",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIndexes: indexesToExport,
          columns: selectedColumns,
          fileName: exportFileName,
          fullData: trips
        })
      }
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.xlsx`;
    link.click();
    logSuccess("EXCEL EXPORTED SUCCESSFULLY");

    setShowExportModal(false);

  } catch (err) {
  logError("EXCEL EXPORT FAILED", err);
  alert("Excel export failed");
  }
};

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl p-6 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-end">

          {/* From Date */}
          <div>
            <label className="text-sm text-slate-600">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
  logInfo("Filter changed", { field: "fromDate", value: e.target.value });
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
  logInfo("Filter changed", { field: "toDate", value: e.target.value });
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
  disabled={isBranchManager || isRegionalManager}
  onChange={e => {
  logInfo("Filter changed", { field: "cluster", value: e.target.value });
  setCluster(e.target.value);
}}
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
  disabled={!cluster || isBranchManager}
  value={branch}
  onChange={e => {
  logInfo("Filter changed", { field: "branch", value: e.target.value });
  setBranch(e.target.value);
}}
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

          {/* Buttons */}
          <div className="flex gap-3 md:col-span-2">
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
  onClick={() => setShowExportModal(true)}
  disabled={trips.length === 0}
  className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
>
  Export Data
</button>

          </div>

        </div>
      </div>

{/* ================= SELECT ALL PAGES ================= */}
      {trips.length > 0 && (
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={(e) => {
        const checked = e.target.checked;
        setSelectAllAllPages(checked);

        if (checked) {
          const allIndexes = trips.map((_, i) => i);
          setSelectedRows(allIndexes);
        } else {
          setSelectedRows([]);
        }
      }}
    />
    Select all records from all pages
  </div>
)}

      {/* ================= TABLE ================= */}
<div className="bg-white rounded-xl border mt-6 flex flex-col flex-1 overflow-hidden">

  {/* Record Count */}
  <div className="text-center py-3 font-semibold border-b">
    No. Of Records: {trips.length}
  </div>
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="min-w-[2000px] w-full text-sm border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-20">
  <tr>

    {/* Select Page Checkbox */}
    <th className="px-4 py-4 border text-center">
      <input
        type="checkbox"
        checked={selectAllPage}
        onChange={(e) => {
          const checked = e.target.checked;

          const pageIndexes = currentTrips.map(
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

    <th className="px-6 py-4 border">S. No.</th>

    {[
      "User Name",
      "User Id",
      "Member Name",
      "Account Number",
      "Branch Name",
      "Month Year",
      "Date",
      "Total Distance",
      "Distance Travelled",
      "Start Location",
      "End Location",
    ].map(col => (
      <th
        key={col}
        className="px-6 py-4 border text-left font-semibold whitespace-nowrap"
      >
        {col}
      </th>
    ))}

  </tr>
</thead>
            <tbody>
  {loading ? (
    <tr>
      <td colSpan={13} className="text-center py-16">
        Loading...
      </td>
    </tr>
  ) : trips.length === 0 ? (
    <tr>
      <td colSpan={13} className="text-center py-16 text-slate-400">
        No records found
      </td>
    </tr>
  ) : (
    currentTrips.map((row, i) => {
      const globalIndex = indexOfFirstRecord + i;

      return (
        <tr key={globalIndex} className="hover:bg-slate-50">

          {/* Row Checkbox */}
          <td className="px-4 py-3 border text-center">
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

          {/* S. No */}
          <td className="px-6 py-3 border">
            {globalIndex + 1}
          </td>

          <td className="px-6 py-3 border">{row.UserName}</td>
          <td className="px-6 py-3 border">{row.UserId}</td>
          <td className="px-6 py-3 border">{row.MemberName}</td>
          <td className="px-6 py-3 border">{row.AccountNumber}</td>
          <td className="px-6 py-3 border">{row.BranchName}</td>
          <td className="px-6 py-3 border">{row.MonthYear}</td>
          <td className="px-6 py-3 border">
            {row.VisitDate?.split("T")[0]}
          </td>
          <td className="px-6 py-3 border">{row.TotalDistance}</td>
          <td className="px-6 py-3 border">{row.DistanceTravelled}</td>
          <td className="px-6 py-3 border">{row.StartLocation}</td>
          <td className="px-6 py-3 border">{row.EndLocation}</td>

        </tr>
      );
    })
  )}
</tbody>
          </table>

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
        {[
          "serialNumber",
          "UserName",
          "UserId",
          "MemberName",
          "AccountNumber",
          "BranchName",
          "MonthYear",
          "VisitDate",
          "TotalDistance",
          "DistanceTravelled",
          "StartLocation",
          "EndLocation"
        ].map(col => (
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

        <div className="flex gap-3">

<button
  onClick={handleExportExcel}
  className="px-4 py-2 bg-green-600 text-white rounded"
>
  Export Excel
</button>

<button
  onClick={handleExportPDF}
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  Export PDF
</button>

</div>
      </div>
    </div>
  </div>
)}

        </div>

        {/* ================= PAGINATION ================= */}
{trips.length > 0 && (
  <div className="flex items-center justify-between px-6 py-4 border-t bg-white text-sm text-slate-600">

  {/* Showing Records */}
  <div>
    Showing {firstRecord}-{lastRecord} of {trips.length}
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
    </div>
  );
};

export default UserTrips;
