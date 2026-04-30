import { useEffect, useState, useMemo } from "react";

// ✅ Logger
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

const ActivitySummary = () => {

const EXPORT_COLUMNS = [
  { key: "UserName", label: "User Name" },
  { key: "BranchName", label: "Branch Name" },
  { key: "Assigned", label: "No Of Accounts Assigned" },
  { key: "NotCalled", label: "Not Called" },
  { key: "CalledOnce", label: "No Of Acs Called Ones" },
  { key: "CalledTwice", label: "No Of Acs Called Twice" },
  { key: "CalledThrice", label: "No Of Acs Called Thrice" },
  { key: "NoOfTimesCalled", label: "No. of Times Called" },
  { key: "NoOfVisits", label: "No Of Visits" }
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

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedRows, setSelectedRows] = useState([]);

// ✅ ADD HERE
const role = localStorage.getItem("role");

useEffect(() => {
  logInfo("ACTIVITY SUMMARY PAGE LOADED", {
    role,
    userId: localStorage.getItem("userId")
  });
}, [role]);

useEffect(() => {
  logInfo("Initial state", {
    cluster,
    branch,
    user,
    fromDate,
    toDate
  });
}, [cluster, branch, user, fromDate, toDate]);

const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

const isBranchManager = role === "Branch Manager";
const isRegionalManager = role?.startsWith("Regional Manager");

let userCluster = "";

if (isRegionalManager) {

  const match = role.match(/\((.*?)\)/);
  userCluster = match ? match[1] : "";

}

useEffect(() => {
logInfo("Regional Manager effect triggered", { isRegionalManager, userCluster });
logInfo("RM effect started");
  if (isRegionalManager) {

    setCluster(userCluster);

logInfo("Fetching branches for regional manager", userCluster);
    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(userCluster)}`)
      .then(res => {
  if (!res.ok) {
    logError("API failed", res.status);
    throw new Error("API failed");
  }
  return res.json();
})
      .then(data => {
  logSuccess("Branches fetched", data);
  setBranches(data);
})
      .catch(err => {
  logError("Branch fetch error", err);
  setBranches([]);
});
logSuccess("RM effect completed");
  }
}, [isRegionalManager, userCluster]);

  const totalPages = Math.max(
  1,
  Math.ceil(tableData.length / RECORDS_PER_PAGE)
);

  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;

  const paginatedData = useMemo(() => {
  return Array.isArray(tableData)
    ? tableData.slice(startIndex, endIndex)
    : [];
}, [tableData, startIndex, endIndex]);

const indexOfFirstRecord = startIndex + 1;
const indexOfLastRecord = Math.min(endIndex, tableData.length);
  
  const [showExport, setShowExport] = useState(false);
  const [fileName, setFileName] = useState("Activity_Summary_Report");
  const [selectedCols, setSelectedCols] = useState(
  EXPORT_COLUMNS.map(c => c.key) // ✅ all selected by default
);

useEffect(() => {
  const pageIDs = paginatedData.map((_, i) => startIndex + i);

  const allSelected =
    pageIDs.length > 0 &&
    pageIDs.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);
}, [paginatedData, selectedRows, startIndex]);

  // ================= LOAD CLUSTERS =================
  useEffect(() => {
    const startTime = Date.now();
logInfo("Fetching clusters API started");
  fetch("https://mobile.coastal.bank.in:5001/api/clusters")
    .then(res => {
  if (!res.ok) {
    logError("API failed", res.status);
    throw new Error("API failed");
  }
  return res.json();
})
    .then(data => {
  logInfo("Clusters API response time (ms)", Date.now() - startTime);
  logSuccess("Clusters fetched", data);
  setClusters([
    { cluster_name: "Corporate Office" },
    ...data
  ]);
})
.catch(err => {
  logError("CLUSTER FETCH ERROR", {
    error: err.message,
    stack: err.stack
  });
});
}, []);

  useEffect(() => {
    logInfo("Cluster changed (triggering data reload)", cluster);
  if (!cluster) {
  logWarn("Cluster empty - skipping API calls");
  return;
}

  // ✅ If Corporate Office → load ALL users
  if (cluster === "Corporate Office" && !isBranchManager) {

logInfo("Fetching ALL branches");
  // ✅ LOAD ALL BRANCHES
  fetch("https://mobile.coastal.bank.in:5001/api/branches")
    .then(res => {
  if (!res.ok) {
    logError("API failed", res.status);
    throw new Error("API failed");
  }
  return res.json();
})
    .then(data => {
  logSuccess("Branches fetched (Corporate Office)", data);
  setBranches(data);
})
    .catch(err => {
  logError("Corporate branch fetch error", err);
  setBranches([]);
});

    logInfo("Fetching ALL users");
  // ✅ LOAD ALL USERS
  fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": localStorage.getItem("userId")
    },
    body: JSON.stringify({})
  })
    .then(res => {
  if (!res.ok) {
    logError("AssignUsers API failed", res.status);
    throw new Error("Unauthorized");
  }
  return res.json();
})
    .then(data => {
  logSuccess("Users fetched", data);
  setUsers(Array.isArray(data) ? data : []);
})
    .catch(err => {
  logError("Users fetch error", {
  error: err.message,
  stack: err.stack
});
  setUsers([]);
});

  setBranch("");
  setUser("");
  return;
}

logInfo("Fetching branches for cluster", cluster);
  // 🔹 Normal Cluster Flow
  fetch(`https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(cluster)}`)
  .then(res => {
  if (!res.ok) {
    logError("API failed", res.status);
    throw new Error("API failed");
  }
  return res.json();
})
  .then(data => {
  logSuccess("Branches fetched", data);
  setBranches(data);

  if (isBranchManager) {
    const userBranch = localStorage.getItem("branchName");
    if (userBranch) setBranch(userBranch);
  }
})
.catch(err => {
  logError("Cluster branch fetch error", err);
  setBranches([]);
});

  const userApiStart = Date.now();
logInfo("Fetching users API started", { cluster });
  fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
    method: "POST",
    headers: {
  "Content-Type": "application/json",
  "x-user-id": localStorage.getItem("userId")
},
    body: JSON.stringify({ cluster })
  })
    .then(res => {
  if (!res.ok) {
    logError("AssignUsers API failed", res.status);
    throw new Error("Unauthorized");
  }
  return res.json();
})
.then(data => {
  logInfo("Users API response time (ms)", Date.now() - userApiStart);
  logSuccess("Users fetched", data);
  setUsers(Array.isArray(data) ? data : []);
})
.catch(err => {
  logError("USERS FETCH ERROR", {
    error: err.message,
    stack: err.stack
  });
  setUsers([]);
});

}, [cluster, isBranchManager]);


useEffect(() => {
  logInfo("Fetching users with cluster & branch", { cluster, branch });

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
  if (!res.ok) {
    logError("AssignUsers API failed", res.status);
    throw new Error("Unauthorized");
  }
  return res.json();
})

    .then(data => {
  logSuccess("Users fetched", data);
  setUsers(Array.isArray(data) ? data : []);
})
    .catch(err => {
  logError("USER FETCH ERROR", {
    error: err.message,
    stack: err.stack
  });
  setUsers([]);
});

}, [cluster, branch, isBranchManager, isRegionalManager, userCluster]);

  // ================= BRANCH CHANGE =================
  useEffect(() => {
    logInfo("Branch changed", { branch, cluster });
  if (!branch || !cluster) return;

  logInfo("Fetching users for branch", branch);
  fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userId")
  },
  body: JSON.stringify({
  cluster,
  branchName: isBranchManager
    ? localStorage.getItem("branchName")
    : branch
})
})
    .then(res => {
  if (!res.ok) {
    logError("AssignUsers API failed", res.status);
    throw new Error("Unauthorized");
  }
  return res.json();
})

.then(data => {
  logSuccess("Users fetched", data);
  setUsers(Array.isArray(data) ? data : []);
})
.catch(err => {
  logError("BRANCH USER FETCH ERROR", {
  error: err.message,
  stack: err.stack
});
  setUsers([]);
});

  setUser("");
}, [branch, cluster, isBranchManager]);

useEffect(() => {
  if (isBranchManager) {
    const userBranch = localStorage.getItem("branchName");
    const userCluster = localStorage.getItem("clusterName");

    if (userBranch) setBranch(userBranch);
    if (userCluster) setCluster(userCluster);
  }
}, [isBranchManager]);


const handleSearch = async () => {

  const startTime = Date.now();
logInfo("SEARCH STARTED", {
  filters: { user, cluster, branch, fromDate, toDate }
});

  const hasAnyFilter = [
    user,
    cluster,
    branch,
    fromDate,
    toDate
  ].some(v => v && v.trim() !== "");

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching");
    logWarn("Search blocked - no filters");
    return;
  }
  logSuccess("Search validation passed");

  const payload = {
    user,
    cluster,
    branch,
    fromDate,
    toDate
  };
  logInfo("Search payload", payload);

  setLoading(true);
  setCurrentPage(1);

  try {
    logInfo("API CALL STARTED → Activity Summary", payload);
    const apiStart = Date.now();
    const res = await fetch("https://mobile.coastal.bank.in:5001/api/activity-summary", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  "x-user-id": localStorage.getItem("userId")
},
      body: JSON.stringify(payload)
    });
logInfo("API response status", res.status);

    const data = await res.json();
    logInfo("API response time (ms)", Date.now() - apiStart);
    logSuccess("API RESPONSE RECEIVED", {
  recordCount: Array.isArray(data) ? data.length : 0
});

if (Array.isArray(data)) {
  setTableData(data);
  logSuccess("Table data updated", {
  rows: data.length
});
} else if (Array.isArray(data?.data)) {
  setTableData(data.data);
  logInfo("Table data set (nested)", data.data.length);
} else {
  setTableData([]);
  logWarn("No valid data received, table cleared");
}

    setSelectedRows([]);
    setSelectAllPage(false);
    setSelectAllAllPages(false);

  } catch (err) {
    logError("SEARCH ERROR", {
  error: err.message,
  stack: err.stack
});
  } finally {
  const totalTime = Date.now() - startTime;

logInfo("Search execution time (ms)", totalTime);

logSuccess("SEARCH COMPLETED", {
  totalTimeMs: totalTime
});
  setLoading(false);
}
};


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
  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);
  logInfo("Reset state cleared");
  logSuccess("Reset completed");

};

const handleBackendPDFExport = async () => {

  const pdfStart = Date.now();

logInfo("PDF EXPORT STARTED", {
  selectedCount: selectedRows.length,
  columns: selectedCols,
  fileName
});

  // 🔹 If no rows selected → export ALL search results
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

  const payload = {
    selectedData: rowsToExport,
    columns: selectedCols,
    fileName
  };

  try {
    logInfo("Calling PDF export API", payload);
    const res = await fetch(
      "https://mobile.coastal.bank.in:5001/api/activity-summary/export-pdf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId")
        },
        body: JSON.stringify(payload)
      }
    );
    logInfo("PDF API response status", res.status);

    if (!res.ok) throw new Error("Failed to export PDF");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
    logSuccess("PDF GENERATED SUCCESSFULLY", {
  timeMs: Date.now() - pdfStart
});
    setShowExport(false);

  } catch (err) {
    logError("PDF EXPORT ERROR", {
  error: err.message,
  stack: err.stack
});
alert("Failed to export PDF");
  }
};

  // ================= UI =================
  return (
    <div className="bg-white rounded-xl shadow p-6">

      {/* Filters */}
      <div className="grid grid-cols-5 gap-4 mb-4">

        <Select
          label="User"
          value={user}
          onChange={e => {
  logInfo("User filter changed", e.target.value);
  setUser(e.target.value);
}}
          options={users.map(u => ({
  value: u.userId,     // UNIQUE
  label: u.name
}))}
        />

        <DateInput
  label="From Date"
  value={fromDate}
  onChange={e => {
  logInfo("From Date changed", e.target.value);
  setFromDate(e.target.value);
}}
/>

<DateInput
  label="To Date"
  value={toDate}
  onChange={e => {
  logInfo("To Date changed", e.target.value);
  setToDate(e.target.value);
}}
/>

        <Select
  label="Cluster"
  value={cluster}
  onChange={e => {
  logInfo("Cluster changed (UI)", e.target.value);
  setCluster(e.target.value);
}}
  disabled={isBranchManager || isRegionalManager}
  options={clusters.map(c => ({
    value: c.cluster_name,
    label: c.cluster_name
  }))}
/>

        <Select
  label="Branch"
  value={branch}
  onChange={e => {
  logInfo("Branch changed (UI)", e.target.value);
  setBranch(e.target.value);
}}
  disabled={!cluster || isBranchManager}
  options={branches.map(b => ({
    value: b.branch_name,
    label: b.branch_name
  }))}
/>

      </div>

      {/* Buttons */}
      <div className="flex gap-3 mb-4">
        <button
  className="px-4 py-2 bg-primary text-white rounded"
  onClick={handleSearch}
>
  Search
</button>

        <button
  className="px-4 py-2 bg-slate-200 rounded"
  onClick={handleReset}
>
  Reset
</button>

<button
    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
    onClick={() => {
  logInfo("Export modal opened");
  setShowExport(true);
}}
    disabled={tableData.length === 0}
  >
    Export PDF
  </button>
      </div>

      <div className="mb-2 flex items-center gap-2 text-sm text-slate-600">
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

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">

<div className="text-center py-3 font-semibold border-b">
  No. Of Records: {tableData.length}
</div>

        <table className="w-full text-sm border border-slate-300 border-collapse">
          <thead className="bg-slate-100">
  <tr>

    {/* Select Current Page Checkbox */}
    <th className="p-3 border border-slate-300 text-center">
      <input
        type="checkbox"
        checked={selectAllPage}
        onChange={(e) => {
  const checked = e.target.checked;
  logInfo("Select current page toggled", checked);

  const pageIDs = paginatedData.map((_, i) => startIndex + i);

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

    <th className="p-3 border border-slate-300 font-semibold">S. No.</th>
    <th className="p-3 border border-slate-300 font-semibold">User Name</th>
    <th className="p-3 border border-slate-300 font-semibold">Branch Name</th>
    <th className="p-3 border border-slate-300 font-semibold">Assigned</th>
    <th className="p-3 border border-slate-300 font-semibold">Not Called</th>
    <th className="p-3 border border-slate-300 font-semibold">Called Once</th>
    <th className="p-3 border border-slate-300 font-semibold">Called Twice</th>
    <th className="p-3 border border-slate-300 font-semibold">Called Thrice</th>
    <th className="p-3 border border-slate-300 font-semibold">No. of Times Called</th>
    <th className="p-3 border border-slate-300 font-semibold">No Of Visits</th>

  </tr>
</thead>
          <tbody>
  {loading ? (
    <tr>
      <td colSpan="11" className="p-6 text-center">
        Loading...
      </td>
    </tr>
  ) : tableData.length === 0 ? (
    <tr>
      <td colSpan="11" className="p-6 text-center text-slate-400">
        No records found
      </td>
    </tr>
  ) : (
    paginatedData.map((row, i) => {
      const rowIndex = startIndex + i;

      return (
        <tr key={rowIndex}>

          {/* Row Checkbox */}
          <td className="p-3 border border-slate-300 text-center">
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

          <td className="p-3 border border-slate-300">
            {rowIndex + 1}
          </td>

          <td className="p-3 border border-slate-300">{row.UserName}</td>
          <td className="p-3 border border-slate-300">{row.BranchName}</td>
          <td className="p-3 border border-slate-300">{row.Assigned}</td>
          <td className="p-3 border border-slate-300">{row.NotCalled}</td>
          <td className="p-3 border border-slate-300">{row.CalledOnce}</td>
          <td className="p-3 border border-slate-300">{row.CalledTwice}</td>
          <td className="p-3 border border-slate-300">{row.CalledThrice}</td>
          <td className="p-3 border border-slate-300">{row.NoOfTimesCalled}</td>
          <td className="p-3 border border-slate-300">{row.NoOfVisits}</td>

        </tr>
      );
    })
  )}
</tbody>
        </table>
      </div>

      {tableData.length > 0 && (
  <div className="flex items-center justify-between mt-4 text-sm text-slate-600">

    {/* Showing Records */}
    <div>
      Showing {indexOfFirstRecord}–{indexOfLastRecord} of {tableData.length}
    </div>

    {/* Pagination Controls */}
    <div className="flex items-center gap-2">

      <button
        disabled={currentPage === 1}
        onClick={() => {
  logInfo("Pagination → First page");
  setCurrentPage(1);
}}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        ⏮
      </button>

      <button
        disabled={currentPage === 1}
        onClick={() => {
  logInfo("Pagination → Previous page");
  setCurrentPage(p => p - 1);
}}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        ◀
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => {
  logInfo("Pagination → Next page");
  setCurrentPage(p => p + 1);
}}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        ▶
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={() => {
  logInfo("Pagination → Last page");
  setCurrentPage(totalPages);
}}
        className="px-2 py-1 border rounded disabled:opacity-50"
      >
        ⏭
      </button>

    </div>
  </div>
)}

{showExport && (
  <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
    <div className="bg-white w-[600px] rounded-lg shadow p-6">

      <h2 className="text-lg font-semibold mb-4">Export Grid</h2>

      {/* Filename */}
      <label className="text-sm font-medium">Filename</label>
      <input
        className="w-full border p-2 rounded mt-1 mb-4"
        value={fileName}
        onChange={e => {
  logInfo("Filename changed", e.target.value);
  setFileName(e.target.value);
}}
      />

      {/* Column Selection */}
      <div className="max-h-60 overflow-auto border rounded p-3 mb-4">
        {EXPORT_COLUMNS.map(col => (
          <label
            key={col.key}
            className="flex items-center gap-2 mb-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selectedCols.includes(col.key)}
              onChange={() =>
                setSelectedCols(prev =>
                  prev.includes(col.key)
                    ? prev.filter(k => k !== col.key)
                    : [...prev, col.key]
                )
              }
            />
            {col.label}
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 border rounded"
          onClick={() => {
  logInfo("Export modal closed");
  setShowExport(false);
}}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-primary text-white rounded"
          onClick={handleBackendPDFExport}
        >
          Download PDF
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
};


// ================= REUSABLE COMPONENTS =================
const Select = ({ label, value, onChange, options = [], disabled = false }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>

    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full mt-1 px-3 py-2 border rounded transition-all
        ${
          disabled
            ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
            : "bg-slate-100 text-black"
        }
      `}
    >
      <option value="">Select</option>

      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}

    </select>
  </div>
);



const DateInput = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <input
      type="date"
      value={value}
      onChange={onChange}
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
    />
  </div>
);


export default ActivitySummary;
