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

const LeadDataReport = () => {

useEffect(() => {
  logInfo("LEAD DATA REPORT PAGE LOADED", {
    role: localStorage.getItem("role"),
    userId: localStorage.getItem("userId")
  });
}, []);

  const ALL_COLUMNS = [
  "serialNumber",
  "BranchName",
  "LeadGeneratedBy",
  "LeadAssignedTo",
  "MemberName",
  "MemberAddress",
  "MemberMobileNumber",
  "ProductCategory",
  "InitialProduct",
  "InterestedProduct",
  "DateOfEntry",
  "DateOfVisit",
  "ActivityStatus"
];

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);

  const [cluster, setCluster] = useState("");
  const [branch, setBranch] = useState("");
  const [user, setUser] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${rmCluster}`)
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

useEffect(() => {

  logInfo("Branch Manager Effect Triggered", {
    userCluster,
    userBranch
  });

  if (isBranchManager) {

    logInfo("Branch Manager auto selection applied");

    setCluster(userCluster);

    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${userCluster}`)
      .then(res => res.json())
      .then(data => {
        logSuccess("BM Branches loaded", data);
        setBranches(data);
        setBranch(userBranch);
      })
      .catch(err => logError("BM Branch load error", err));

  }

}, [isBranchManager, userCluster, userBranch]);

const [showExportModal, setShowExportModal] = useState(false);
const [exportFileName, setExportFileName] = useState("Lead_Data_Report");

  const indexOfLastRecord = currentPage * recordsPerPage;
const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

const currentRows = rows.slice(indexOfFirstRecord, indexOfLastRecord);
const totalPages = Math.ceil(rows.length / recordsPerPage);

const firstRecord = rows.length === 0 ? 0 : indexOfFirstRecord + 1;
const lastRecord = Math.min(indexOfLastRecord, rows.length);
  const [selectedColumns, setSelectedColumns] = useState(ALL_COLUMNS);


useEffect(() => {
  logInfo("Fetching clusters API");
  fetch("https://mobile.coastal.bank.in:5001/api/clusters")
    .then(res => res.json())
    .then(data => {
  logSuccess("Clusters fetched", data);
  setClusters(data);
});
}, []);


useEffect(() => {
  logInfo("Cluster changed", cluster);
  logWarn("Cluster cleared → resetting branches");
  if (!cluster) {
    setBranches([]);
    setBranch("");
    return;
  }

logInfo("Fetching branches for cluster", cluster);
  fetch(`https://mobile.coastal.bank.in:5001/api/branches/${cluster}`)
    .then(res => res.json())
    .then(data => {
      logSuccess("Branches loaded", data);
      setBranches(data);

      // ✅ Keep branch for Branch Manager
      if (isBranchManager) {
        setBranch(userBranch);
      } else {
        setBranch("");
      }
    })
    .catch(err => logError("Branch load error", err));
}, [cluster, isBranchManager, userBranch]);



useEffect(() => {

  const loadUsers = async () => {
    logInfo("Loading users", { cluster, branch });

    let selectedCluster = cluster;
    let selectedBranch = branch;

    // 🔹 Corporate Office special case
    if (cluster === "Corporate Office") {
      selectedCluster = "";
    }

    // 🔹 FORCE branch for Branch Manager
    if (isBranchManager) {
      selectedCluster = userCluster;
      selectedBranch = userBranch;
    }

    try {
logInfo("Calling Users API");
      const res = await fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId")
        },
        body: JSON.stringify({
          cluster: selectedCluster || "",
          branchName: selectedBranch || ""
        })
      });

logInfo("Users API response received", res.status);
      if (!res.ok) throw new Error("Unauthorized");

      logInfo("Lead Data API response received", res.status);
      const data = await res.json();
      logSuccess("Users loaded", data);

      setUsers(Array.isArray(data) ? data : []);
      setUser("");

    } catch (err) {
      logError("Users load error", err);
      setUsers([]);
      setUser("");

    }

  };

  loadUsers();

}, [cluster, branch, isBranchManager, userCluster, userBranch]);


const handleSearch = async () => {

  logInfo("LEAD DATA SEARCH STARTED", {
  user,
  cluster,
  branch,
  fromDate,
  toDate
});

  const hasAnyFilter =
    user ||
    cluster ||
    branch ||
    fromDate ||
    toDate;

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching.");
    logWarn("Search blocked - no filters");
    return; // 🚫 STOP SEARCH
  }

  try {

  logInfo("Calling Lead Data API");

  const res = await fetch("https://mobile.coastal.bank.in:5001/api/lead-data-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": localStorage.getItem("userId")
    },
    body: JSON.stringify({
      userId: user,
      cluster,
      branch,
      fromDate,
      toDate
    })
  });

  const data = await res.json();

  setRows(data || []);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);

  logSuccess("SEARCH SUCCESS", {
    count: data?.length || 0
  });

  if (!data || data.length === 0) {
  logWarn("No records found");
}

} catch (err) {

  logError("SEARCH FAILED", err);

}
};


const handleReset = () => {

  logWarn("RESET TRIGGERED");

  if (isBranchManager) {
  setCluster(userCluster);

  logInfo("Fetching branches for Branch Manager reset", userCluster);
  fetch(`https://mobile.coastal.bank.in:5001/api/branches/${userCluster}`)
    .then(res => res.json())
    .then(data => {
  logSuccess("BM Reset branches loaded", data);
      setBranches(data);
      setBranch(userBranch);
    });

}
else if (isRegionalManager) {

  setCluster(rmCluster);

  logInfo("Fetching branches for RM reset", rmCluster);
  fetch(`https://mobile.coastal.bank.in:5001/api/branches/${rmCluster}`)
    .then(res => res.json())
    .then(data => {
  logSuccess("RM Reset branches loaded", data);
      setBranches(data);
      setBranch("");
    });

}
else {
  setCluster("");
  setBranch("");
  setBranches([]);
}
  setUser("");
  setFromDate("");
  setToDate("");
  setRows([]);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);
  logSuccess("RESET COMPLETED");
};

useEffect(() => {
  const pageIndexes = currentRows.map(
    (_, i) => indexOfFirstRecord + i
  );

  const allSelected =
    pageIndexes.length > 0 &&
    pageIndexes.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);

}, [currentPage, selectedRows, currentRows, indexOfFirstRecord]);

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
        ? rows.map((_, i) => i)   // export ALL
        : selectedRows;           // export selected

        logInfo("Calling Export PDF API");
    const response = await fetch(
      "https://mobile.coastal.bank.in:5001/api/lead-data-report/export-pdf",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIndexes: indexesToExport,
          columns: selectedColumns,
          fileName: exportFileName,
          fullData: rows
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


const handleExportExcel = async () => {

  logInfo("EXPORT EXCEL STARTED", {
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
        ? rows.map((_, i) => i)
        : selectedRows;

        logInfo("Calling Export Excel API");
    const response = await fetch(
      "https://mobile.coastal.bank.in:5001/api/lead-data-report/export-excel",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIndexes: indexesToExport,
          columns: selectedColumns,
          fileName: exportFileName,
          fullData: rows
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
        <div className="grid grid-cols-5 gap-6">

          <div>
            <label className="text-sm text-slate-600">User</label>
            <select
  className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
  value={user}
  onChange={e => {
  logInfo("Filter changed", { field: "user", value: e.target.value });
  setUser(e.target.value);
}}
>
  <option value="">Select</option>
  {Array.isArray(users) && users.map(u => (
    <option key={u.userId} value={u.userId}>
      {u.name}
    </option>
  ))}
</select>
          </div>

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

          <div>
            <label className="text-sm text-slate-600">Cluster</label>
            <select
  value={cluster}
  onChange={e => {
  logInfo("Filter changed", { field: "cluster", value: e.target.value });
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
  <option value="Corporate Office">Corporate Office</option>
  {clusters.map(c => (
    <option key={c.cluster_name} value={c.cluster_name}>
      {c.cluster_name}
    </option>
  ))}
</select>
          </div>

          <div>
            <label className="text-sm text-slate-600">Branch</label>
            <select
  value={branch}
  onChange={e => {
  logInfo("Filter changed", { field: "branch", value: e.target.value });
  setBranch(e.target.value);
}}
  disabled={isBranchManager}
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
  disabled={rows.length === 0}
  onClick={() => setShowExportModal(true)}
  className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
>
  Export Data
</button>

        </div>
      </div>

{/* ================= SELECT ALL RECORDS ================= */}
      {rows.length > 0 && (
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={(e) => {
        const checked = e.target.checked;
        setSelectAllAllPages(checked);

        if (checked) {
          const allIndexes = rows.map((_, i) => i);
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

        <div className="text-center py-3 font-semibold border-b">
  No. Of Records: {rows.length}
</div>

        {/* ONLY TABLE SCROLLS */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-sm border-collapse">
  <thead className="bg-slate-100">
  <tr>

    {/* Page Select Checkbox */}
    <th className="p-3 border text-center">
      <input
        type="checkbox"
        checked={selectAllPage}
        onChange={(e) => {
          const checked = e.target.checked;

          const pageIndexes = currentRows.map(
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

    <th className="p-3 border">S. No.</th>
    <th className="p-3 border">Branch Name</th>
    <th className="p-3 border">Lead Generated By</th>
    <th className="p-3 border">Lead Assigned To</th>
    <th className="p-3 border">Member Name</th>
    <th className="p-3 border">Member Address</th>
    <th className="p-3 border">Member Mobile Number</th>
    <th className="p-3 border">Product Category</th>
    <th className="p-3 border">Initial Product</th>
    <th className="p-3 border">Interested Product</th>
    <th className="p-3 border">Date Of Entry</th>
    <th className="p-3 border">Date Of Visit</th>
    <th className="p-3 border">Activity Status</th>
  </tr>
</thead>


  <tbody>
  {rows.length === 0 ? (
    <tr>
      <td colSpan={13} className="text-center py-10 text-slate-400">
        No records found
      </td>
    </tr>
  ) : (
    currentRows.map((r, i) => {
      const globalIndex = indexOfFirstRecord + i;

      return (
        <tr key={globalIndex}>

          {/* Row Checkbox */}
          <td className="p-3 border text-center">
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

          {/* S.No */}
          <td className="p-3 border text-center">
            {globalIndex + 1}
          </td>

          <td className="p-3 border">{r.BranchName}</td>
          <td className="p-3 border">{r.LeadGeneratedBy}</td>
          <td className="p-3 border">{r.LeadAssignedTo}</td>
          <td className="p-3 border">{r.MemberName}</td>
          <td className="p-3 border">{r.MemberAddress}</td>
          <td className="p-3 border">{r.MemberMobileNumber}</td>
          <td className="p-3 border">{r.ProductCategory}</td>
          <td className="p-3 border">{r.InitialProduct}</td>
          <td className="p-3 border">{r.InterestedProduct}</td>
          <td className="p-3 border">{r.DateOfEntry}</td>
          <td className="p-3 border">{r.DateOfVisit}</td>
          <td className="p-3 border">
  <span
className={`font-semibold ${
  r.ActivityStatus === "OPEN"
    ? "text-green-600"
    : r.ActivityStatus === "WORKING"
    ? "text-blue-600"
    : r.ActivityStatus === "NOT INTERESTED"
    ? "text-gray-600"
    : "text-red-600"
}`}
>
  {r.ActivityStatus}
</span>
</td>

        </tr>
      );
    })
  )}
</tbody>
</table>


 {/* PAGINATION */}
{rows.length > 0 && (
  <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50 text-sm text-slate-600">

  {/* Showing Records */}
  <div>
    Showing {firstRecord}-{lastRecord} of {rows.length}
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
      </div>
    </div>
  );
};

export default LeadDataReport;
