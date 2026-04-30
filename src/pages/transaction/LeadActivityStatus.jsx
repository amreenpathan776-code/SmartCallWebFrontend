import { useEffect, useState } from "react";

// ✅ Logger
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

const LeadActivityStatus = () => {
  const [filters, setFilters] = useState({
    memberName: "",
    mobileNumber: "",
    pincode: "",
    cluster: "",
    branchName: "",
    product: "",
    leadType: "",
    leadStatus: "",
    assignedTo: "",
    closedBy: ""
  });

  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
const ROWS_PER_PAGE = 15;

const [selectedRows, setSelectedRows] = useState([]);
const [selectAllCurrentPage, setSelectAllCurrentPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

const [showActivityModal, setShowActivityModal] = useState(false);
const [activityLogs,setActivityLogs] = useState([]);
const [selectedActionType, setSelectedActionType] = useState("");

const role = localStorage.getItem("role");
const userId = localStorage.getItem("userId");
const userBranch = localStorage.getItem("branchName");
const userCluster = localStorage.getItem("clusterName");

const isBranchManager = role === "Branch Manager";
const isRegionalManager = role?.startsWith("Regional Manager");

useEffect(() => {
  logInfo("User session initialized", {
    userId,
    role,
    userBranch,
    userCluster
  });
}, [userId, role, userBranch, userCluster]);

useEffect(() => {

  if (isBranchManager) {

    setFilters(prev => ({
      ...prev,
      cluster: userCluster,
      branchName: userBranch
    }));

  }

  if (isRegionalManager) {

    setFilters(prev => ({
      ...prev,
      cluster: userCluster
    }));

  }

}, [isBranchManager, isRegionalManager, userBranch, userCluster]);


useEffect(() => {
  logInfo("Calling API: GET /api/clusters");

  fetch("https://mobile.coastal.bank.in:5001/api/clusters")
    .then(res => res.json())
    .then(data => {
      logSuccess("Clusters fetched", data);
      const clusterList = data.map(d => d.cluster_name);
      setClusters(["Corporate Office", ...clusterList]);
    })
    .catch(err => logError("Clusters API failed", err));
}, []);


useEffect(() => {
  logInfo("Calling API: GET /api/products");

  fetch("https://mobile.coastal.bank.in:5001/api/products")
    .then(res => res.json())
    .then(data => {
      logSuccess("Products fetched", data);
      setProducts(data.map(d => d.product));
    })
    .catch(err => logError("Products API failed", err));
}, []);


useEffect(() => {
  if (!filters.cluster) return;

  logInfo("Calling API: GET /api/branches", filters.cluster);

  fetch(`https://mobile.coastal.bank.in:5001/api/branches/${filters.cluster}`)
    .then(res => res.json())
    .then(data => {
      logSuccess("Branches fetched", data);
      setBranches(data.map(b => b.branch_name));
    })
    .catch(err => logError("Branches API failed", err));
}, [filters.cluster]);


useEffect(() => {

  const branchToUse = isBranchManager
    ? userBranch
    : filters.branchName || "";

  const clusterToUse = isRegionalManager
    ? userCluster
    : filters.cluster || "";

logInfo("Calling API: POST /api/assignUsers/v2", {
  cluster: clusterToUse,
  branchName: branchToUse
});

  fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId
    },
    body: JSON.stringify({
      cluster: clusterToUse,
      branchName: branchToUse
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("API error");
      return res.json();
    })
    .then(data => {

  logSuccess("Assign users fetched", data);
setUsers(Array.isArray(data) ? data : []);
})
.catch(err => {
  logError("Assign users API failed", err);
  setUsers([]);
});

}, [
  filters.cluster,
  filters.branchName,
  isBranchManager,
  isRegionalManager,
  userBranch,
  userCluster,
  userId
]);

const handleSearch = async (action = selectedActionType) => {

  const startTime = Date.now();

logInfo("Search triggered", {
  filters,
  actionType: action
});

  const noFilterSelected =
    !filters.memberName &&
    !filters.mobileNumber &&
    !filters.pincode &&
    !filters.cluster &&
    !filters.branchName &&
    !filters.product &&
    !filters.leadType &&
    !filters.leadStatus &&
    !filters.assignedTo &&
    !filters.closedBy;

  // ✅ STRICT VALIDATION
  if (noFilterSelected) {
    logWarn("Search blocked - no filters selected");
    alert("Please select at least one filter");
    setRows([]);
    return;
  }

  try {

  logInfo("Calling API: POST /api/leads-data/search");

  const res = await fetch("https://mobile.coastal.bank.in:5001/api/leads-data/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId
    },
    body: JSON.stringify({
      ...filters,
      actionType: action
    })
  });

if (!res.ok) {
  logError("Search API HTTP error", res.status);
}
  const data = await res.json();

  if (!res.ok) {
    logError("Search API HTTP error", res.status);
  }

  logSuccess("Search results received", {
    count: data.length,
    timeTaken: `${Date.now() - startTime}ms`
  });

  if (data.length === 0) {
    logWarn("No records found for given filters", filters);
  }

  setRows(Array.isArray(data) ? data : []);
  setCurrentPage(1);

} catch (err) {
  logError("Search API failed", err);
  setRows([]);
}
};


const leadTypes = ["Hot Lead", "Warm Lead", "Cold Lead"];

const leadStatuses = [
  "Open",
  "Closed-Converted",
  "Closed-Not Converted",
  "Working"
];

const indexOfLastRecord = currentPage * ROWS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - ROWS_PER_PAGE;

const safeRows = Array.isArray(rows) ? rows : [];
const currentRows = safeRows.slice(indexOfFirstRecord, indexOfLastRecord);

const totalPages = Math.max(
  1,
  Math.ceil(rows.length / ROWS_PER_PAGE)
);

const firstRecord = rows.length === 0 ? 0 : indexOfFirstRecord + 1;
const lastRecord = Math.min(indexOfLastRecord, rows.length);

useEffect(() => {
  const pageIDs = currentRows.map(r => r.loanAccountNumber);

  const allSelected =
    pageIDs.length > 0 &&
    pageIDs.every(id => selectedRows.includes(id));

  setSelectAllCurrentPage(allSelected);
}, [currentRows, selectedRows]);

const handleViewDetails = async (row) => {

  const startTime = Date.now();

  logInfo("View details clicked", row);

  try {

    const res = await fetch("https://mobile.coastal.bank.in:5001/api/lead-activity-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": localStorage.getItem("userId")
      },
      body: JSON.stringify({
        leadSNo: String(row.loanAccountNumber || "")
      })
    });

    if (!res.ok) {
  logError("Activity details API HTTP error", res.status);
}
    const data = await res.json();

    logSuccess("Activity details fetched", {
      count: data.length,
      timeTaken: `${Date.now() - startTime}ms`
    });

    setActivityLogs(Array.isArray(data) ? data : []);
    setShowActivityModal(true);

  } catch (err) {
    logError("Activity details API failed", err);
  }
};


  return (
    <main className="flex-1 p-6 bg-slate-100">
      <div className="bg-white rounded-xl shadow p-6">
        {/* ================= FILTER SECTION ================= */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          <Input
  label="Member Name"
  value={filters.memberName}
  onChange={(e) =>
    setFilters({ ...filters, memberName: e.target.value })
  }
/>

          <Input
  label="Mobile Number"
  value={filters.mobileNumber}
  onChange={(e) =>
    setFilters({ ...filters, mobileNumber: e.target.value })
  }
/>

<Input
  label="Pincode"
  value={filters.pincode}
  onChange={(e) =>
    setFilters({ ...filters, pincode: e.target.value })
  }
/>

          <Select
  label="Cluster"
  options={clusters}
  value={filters.cluster}
  disabled={isBranchManager || isRegionalManager}
  onChange={(e) => {

    if (isBranchManager) return;

    setFilters({
      ...filters,
      cluster: e.target.value,
      branchName: ""
    });

  }}
/>

          <Select
  label="Branch Name"
  options={branches}
  value={filters.branchName}
  disabled={isBranchManager}
  onChange={(e) => {

    if (isBranchManager) return;

    setFilters({
      ...filters,
      branchName: e.target.value
    });

  }}
/>

          <Select
  label="Product"
  options={products}
  value={filters.product}
  onChange={(e) =>
    setFilters({ ...filters, product: e.target.value })
  }
/>
          <Select
  label="Lead Type"
  options={leadTypes}
  value={filters.leadType}
  onChange={(e) =>
    setFilters({ ...filters, leadType: e.target.value })
  }
/>

          <Select
  label="Lead Status"
  options={leadStatuses}
  value={filters.leadStatus}
  onChange={(e) =>
    setFilters({ ...filters, leadStatus: e.target.value })
  }
/>

          <Select
  label="Assigned To"
  options={users.map(u => ({
  value: u.userId,
  label: u.name
}))}
  value={filters.assignedTo}
  onChange={(e) =>
    setFilters({ ...filters, assignedTo: e.target.value })
  }
/>

          <Select
  label="Closed By"
  options={users.map(u => ({
  value: u.userId,
  label: u.name
}))}
  value={filters.closedBy}
  onChange={(e) =>
    setFilters({ ...filters, closedBy: e.target.value })
  }
/>

        </div>

        {/* ================= ACTION BUTTONS ================= */}
        <div className="flex items-center gap-4 mb-6">
          <button
  className="px-4 py-2 bg-slate-200 rounded"
  onClick={() => {
    logInfo("Reset clicked", {
  role,
  userBranch,
  userCluster
});

  if (isBranchManager) {

    setFilters({
      memberName: "",
      mobileNumber: "",
      pincode: "",
      cluster: userCluster,
      branchName: userBranch,
      product: "",
      leadType: "",
      leadStatus: "",
      assignedTo: "",
      closedBy: ""
    });

    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${userCluster}`)
      .then(res => res.json())
      .then(data => setBranches(data.map(b => b.branch_name)));

  } 
  else if (isRegionalManager) {

    setFilters({
      memberName: "",
      mobileNumber: "",
      pincode: "",
      cluster: userCluster,
      branchName: "",
      product: "",
      leadType: "",
      leadStatus: "",
      assignedTo: "",
      closedBy: ""
    });

    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${userCluster}`)
      .then(res => res.json())
      .then(data => setBranches(data.map(b => b.branch_name)));

  } 
  else {

    setFilters({
      memberName: "",
      mobileNumber: "",
      pincode: "",
      cluster: "",
      branchName: "",
      product: "",
      leadType: "",
      leadStatus: "",
      assignedTo: "",
      closedBy: ""
    });

    setBranches([]);

  }

  setRows([]);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllCurrentPage(false);
  setSelectAllAllPages(false);
  setSelectedActionType("");
}}
>
  Reset
</button>

          <button
  className="px-4 py-2 bg-primary text-white rounded"
  onClick={() => handleSearch(selectedActionType)}
>
  Search
</button>

          <label className="flex items-center gap-2 text-sm text-slate-600 ml-4">
            <input
  type="checkbox"
  checked={selectAllAllPages}
  onChange={(e) => {
    const checked = e.target.checked;
    setSelectAllAllPages(checked);

    if (checked) {
      const allIDs = rows.map(r => r.loanAccountNumber);
      setSelectedRows(allIDs);
      setSelectAllCurrentPage(true);
    } else {
      setSelectedRows([]);
      setSelectAllCurrentPage(false);
    }
  }}
/>
            Select all records from all pages
          </label>

          <button
  onClick={() => {
  logInfo("Past schedule selected");
    setSelectedActionType("past");
    setRows([]);           // clear old data
    setCurrentPage(1);
  }}
  className={`ml-auto px-4 py-2 rounded ${
    selectedActionType === "past"
      ? "bg-blue-600 text-white"
      : "bg-slate-100"
  }`}
>
  Past Schedule ℹ️
</button>

<button
  onClick={() => {
  logInfo("Future schedule selected");
    setSelectedActionType("future");
    setRows([]);
    setCurrentPage(1);
  }}
  className={`px-4 py-2 rounded ${
    selectedActionType === "future"
      ? "bg-blue-600 text-white"
      : "bg-slate-100"
  }`}
>
  Future Schedule ℹ️
</button>

<button
  onClick={async () => {

    const startTime = Date.now();

logInfo("Reactivation triggered", {
  selectedRows,
  selectedActionType
});

    if (!["past", "future"].includes(selectedActionType)) {
      alert("Re-Activate works only for Past or Future Schedule");
      return;
    }

    if (selectedRows.length === 0) {
      alert("Select records to Reactivate");
      return;
    }

    try {

      const res = await fetch("https://mobile.coastal.bank.in:5001/api/leads/reactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({
          leadIds: selectedRows
        })
      });

      const data = await res.json();
      if (!res.ok) {
  logError("Reactivation API error", data);
}

      logSuccess("Reactivation success", {
  response: data,
  total: selectedRows.length,
  timeTaken: `${Date.now() - startTime}ms`
});

      alert(data.message);

      // ✅ Refresh data
      handleSearch(selectedActionType);

      // ✅ Clear selection
      setSelectedRows([]);
      setSelectAllCurrentPage(false);
      setSelectAllAllPages(false);

    } catch (err) {
  logError("Reactivation failed", err);
      alert("Reactivation failed");
    }

  }}

  disabled={!["past", "future"].includes(selectedActionType)}

  className={`px-4 py-2 rounded text-white ${
    ["past", "future"].includes(selectedActionType)
      ? "bg-green-600"
      : "bg-gray-400 cursor-not-allowed"
  }`}
>
  Re Activate
</button>
        </div>

        {/* ================= TABLE ================= */}
        <div className="border rounded-lg overflow-x-auto">
  <table className="w-full text-sm border border-slate-300">
    <thead className="bg-slate-50">
      <tr>
        <th className="p-3 border border-slate-300 text-center">
          <input
            type="checkbox"
            checked={selectAllCurrentPage}
            onChange={(e) => {
              const checked = e.target.checked;
              const pageIDs = currentRows.map(
                r => r.loanAccountNumber
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

        <th className="p-3 border border-slate-300 text-left">
          S. No.
        </th>

        <th className="p-3 border border-slate-300 text-left">
          Member Name
        </th>

        <th className="p-3 border border-slate-300 text-left">
          Account Number
        </th>

        <th className="p-3 border border-slate-300 text-left">
          Mobile Number
        </th>

        <th className="p-3 border border-slate-300 text-left">
          Branch
        </th>

        <th className="p-3 border border-slate-300 text-left">
  Assigned To
</th>

<th className="p-3 border border-slate-300 text-left">
  Activity Date & Time
</th>

<th className="p-3 border border-slate-300 text-left">
  Action
</th>
      </tr>
    </thead>

    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan="9" className="p-6 text-center text-slate-400">
            No records found
          </td>
        </tr>
      ) : (
        currentRows.map((row, index) => {
          const serialNumber =
            (currentPage - 1) * ROWS_PER_PAGE + index + 1;

          return (
            <tr key={index}>
              <td className="p-3 border border-slate-300 text-center">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(
                    row.loanAccountNumber
                  )}
                  onChange={(e) => {
                    const id = row.loanAccountNumber;

                    if (e.target.checked) {
                      setSelectedRows(prev =>
                        [...new Set([...prev, id])]
                      );
                    } else {
                      setSelectedRows(prev =>
                        prev.filter(rowId => rowId !== id)
                      );
                    }
                  }}
                />
              </td>

              <td className="p-3 border border-slate-300">
                {serialNumber}
              </td>

              <td className="p-3 border border-slate-300">
                {row.memberName}
              </td>

              <td className="p-3 border border-slate-300">
                -
              </td>

              <td className="p-3 border border-slate-300">
                {row.mobileNumber}
              </td>

              <td className="p-3 border border-slate-300">
                {row.branchName}
              </td>

              <td className="p-3 border border-slate-300">
  {row.assignedTo}
</td>

<td className="p-3 border border-slate-300">
  {row.activityDate
  ? `${row.activityDate} ${row.activityTime}`
  : "-"}
</td>

<td className="p-3 border border-slate-300">
  <button
    className="text-blue-600 underline"
    onClick={() => handleViewDetails(row)}
  >
    View Details
  </button>
</td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>

        {/* ================= PAGINATION ================= */}
        {rows.length > 0 && (
  <div className="flex items-center justify-between mt-4 text-sm text-slate-600">

  {/* Record Range */}
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
      onClick={() => setCurrentPage(prev => prev - 1)}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ◀
    </button>

    <span>
      Page {currentPage} of {totalPages}
    </span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(prev => prev + 1)}
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

{showActivityModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
    <div className="bg-white w-[900px] rounded-lg shadow-lg p-6">

      <h2 className="text-xl font-semibold mb-4">
        Activity Details
      </h2>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm border border-slate-300">

          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 border">Activity Date</th>
              <th className="p-3 border">Activity Time</th>
              <th className="p-3 border">User Name</th>
              <th className="p-3 border">Activity Type</th>
              <th className="p-3 border">Activity Status</th>
              <th className="p-3 border">Notes</th>
            </tr>
          </thead>

          <tbody>

{activityLogs.length === 0 ? (

<tr>
<td colSpan="6" className="p-4 text-center text-gray-400">
No Activity Found
</td>
</tr>

) : (

activityLogs.map((log,index)=>(
<tr key={index}>

<td className="p-3 border">
{log.activityDate}
</td>

<td className="p-3 border">
{log.activityTime}
</td>

<td className="p-3 border">
{log.userName}
</td>

<td className="p-3 border">
{log.activityType}
</td>

<td className="p-3 border">
{log.activityStatus
  ? log.activityStatus.split(" -> ").map((item, i) => (
      <div key={i}>{i + 1}. {item}</div>
    ))
  : "-"}
</td>

<td className="p-3 border">
{log.notes}
</td>

</tr>
))

)}

</tbody>

        </table>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => {
  logInfo("Activity modal closed");
  setShowActivityModal(false);
  setActivityLogs([]);
}}
          className="px-4 py-2 bg-slate-200 rounded"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

      </div>
    </main>
  );
};

/* ================= REUSABLE COMPONENTS ================= */

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <input
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
      type="text"
      value={value}
      onChange={onChange}
    />
  </div>
);

const Select = ({ label, options = [], value, onChange, disabled = false }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>

    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full mt-1 px-3 py-2 border rounded
      ${
        disabled
          ? "bg-slate-300 font-semibold cursor-not-allowed"
          : "bg-slate-100"
      }`}
    >
      <option value="">Select</option>

      {options.map((opt) => (
  <option
    key={typeof opt === "object" ? opt.value : opt}
    value={typeof opt === "object" ? opt.value : opt}
  >
    {typeof opt === "object" ? opt.label : opt}
  </option>
))}

    </select>
  </div>
);

export default LeadActivityStatus;
