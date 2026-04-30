import { useEffect, useState } from "react";

// ✅ Logger
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

const authHeaders = () => {
  logInfo("Generating auth headers");  
  return {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userId") || "",
    "x-user-role": localStorage.getItem("role") || "",
    "x-user-branch": localStorage.getItem("branchName") || "",
    "x-user-cluster": localStorage.getItem("clusterName") || ""
  };
};

const ActivityStatus = () => {
  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedCluster, setSelectedCluster] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedAssignedTo, setSelectedAssignedTo] = useState("");

 const [mobileNumber, setMobileNumber] = useState("");
 const [pincode, setPincode] = useState("");
 const [loanAccount, setLoanAccount] = useState("");
 const [memberName, setMemberName] = useState("");

 const [rows, setRows] = useState([]);
 const [loading, setLoading] = useState(false);
 const [hasSearched, setHasSearched] = useState(false);

 const [showDetailsModal, setShowDetailsModal] = useState(false);
 const [activityDetails, setActivityDetails] = useState([]);
 const [detailsLoading, setDetailsLoading] = useState(false);

 const [totalRecords, setTotalRecords] = useState(0);
 const [queue, setQueue] = useState("");
 const [dpdQueue, setDpdQueue] = useState("");
 const [selectedRows, setSelectedRows] = useState([]);
 const [selectedActionType, setSelectedActionType] = useState("");
const [showReactivateModal, setShowReactivateModal] = useState(false);

const role = localStorage.getItem("role");
const userBranch = localStorage.getItem("branchName");
const userCluster = localStorage.getItem("clusterName");

const isBranchManager = role === "Branch Manager";
const isRegionalManager = role?.startsWith("Regional Manager");
const isAdmin = role === "Admin";

 const [showPrintModal, setShowPrintModal] = useState(false);
const [fileName, setFileName] = useState("Activity_Report");

const allColumns = [
  { key: "serialNumber", label: "S. No." },
  { key: "memberName", label: "Member Name" },
  { key: "loanAccountNumber", label: "Loan A/c #" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "branchName", label: "Branch Name" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "activityDetails", label: "Activity Details" }
];

const [selectedColumns, setSelectedColumns] =
  useState(allColumns.map(c => c.key));



 const ROWS_PER_PAGE = 15;
 const [currentPage, setCurrentPage] = useState(1);


 const handleReset = () => {
  logInfo("Reset button clicked");

  if (isBranchManager) {
    setSelectedCluster(userCluster);
    setSelectedBranch(userBranch);
  } 
  else if (isRegionalManager) {
    setSelectedCluster(userCluster);
    setSelectedBranch("");
  } 
  else {
    setSelectedCluster("");
    setSelectedBranch("");
  }

  // 🔹 Clear all filters
  setMobileNumber("");
  setPincode("");
  setLoanAccount("");
  setMemberName("");
  setSelectedProduct("");
  setSelectedAssignedTo("");
  setQueue("");
  setDpdQueue("");

  // 🔥 IMPORTANT FIXES (YOU MISSED THESE)
  setRows([]);                // ✅ clears table data
  setSelectedRows([]);        // ✅ clears checkboxes
  setCurrentPage(1);          // ✅ reset pagination
  setTotalRecords(0);
  setHasSearched(false);
  setSelectedActionType("");

  logSuccess("Filters reset completed");
};

 const openDetailsModal = async (row) => {
  logInfo("Opening details modal", row);   // ✅ ADD HERE

  logInfo("Calling Activity Details API", row.loanAccountNumber);
  if (!row.loanAccountNumber) {
  logWarn("No loan account number found");
  return;
}
  

  setShowDetailsModal(true);
  setDetailsLoading(true);
  setActivityDetails([]);

  try {
    
    const res = await fetch(
      "https://mobile.coastal.bank.in:5001/api/npa-activity-details",
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          loanAccountNumber: row.loanAccountNumber
        })
      }
    );

    if (!res.ok) {
  logError("Activity Details API failed", res.status);
  throw new Error("API error");
}

    const data = await res.json();
    logSuccess("Activity details received", data);
    setActivityDetails(Array.isArray(data) ? data : []);

  } catch (err) {
    logError("Activity details error", err);
    setActivityDetails([]);
  } finally {
    setDetailsLoading(false);
  }
};

 const handleSearch = async () => {

  const startTime = Date.now();
logInfo("Search triggered");

  const hasAnyFilter = [
  mobileNumber,
  pincode,
  loanAccount,
  memberName,
  selectedCluster,
  selectedBranch,
  selectedProduct,
  selectedAssignedTo,
  queue,
  dpdQueue
].some(value => value && String(value).trim() !== "");

logInfo("Validating filters");

logInfo("Search filters", {
  mobileNumber,
  pincode,
  loanAccount,
  memberName,
  selectedCluster,
  selectedBranch,
  selectedProduct,
  selectedAssignedTo,
  queue,
  dpdQueue,
  actionType: selectedActionType
});
// ❗ STRICT RULE: Filter is mandatory
if (!hasAnyFilter) {
  logWarn("Search blocked - no filters selected");
  alert("Please select at least one filter before searching");
  return;
}

  setRows([]);              // ✅ clear old data BEFORE loading
setLoading(true);
setHasSearched(true);
  setCurrentPage(1);

  try {

    // 🔵 IF action button selected → call action API
    if (selectedActionType) {
      logInfo("Calling Action API", {
  actionType: selectedActionType,
  mobileNumber,
  branch: selectedBranch
});

      const res = await fetch(
        "https://mobile.coastal.bank.in:5001/api/activity-status/action",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            actionType: selectedActionType,
            mobileNumber,
            pincode,
            branchName: selectedBranch,
            product: selectedProduct,
            assignedTo: selectedAssignedTo,
            loanAccount,
            memberName,
            cluster: selectedCluster,
            queue,
            dpdQueue
          })
        }
      );

      if (!res.ok) {
  logError("Action API failed", res.status);
  throw new Error("API failed");
}

      const data = await res.json();
      logSuccess("Action API response received", data);

      setRows(Array.isArray(data) ? data : []);
      setTotalRecords(Array.isArray(data) ? data.length : 0);
    }

    // 🔵 ELSE → normal search
    else {
      logInfo("Calling Search API", {
  mobileNumber,
  branch: selectedBranch,
  product: selectedProduct
});

      const res = await fetch(
        "https://mobile.coastal.bank.in:5001/api/activity-status/search",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            mobileNumber,
            pincode,
            branchName: selectedBranch,
            product: selectedProduct,
            assignedTo: selectedAssignedTo,
            loanAccount,
            memberName,
            cluster: selectedCluster,
            queue,
            dpdQueue
          })
        }
      );

      if (!res.ok) {
  logError("Search API failed", res.status);
  throw new Error("API failed");
}

      const data = await res.json();
      logSuccess("Search API response received", data);

      const assignedOnly = Array.isArray(data)
        ? data.filter(r => r.assignedTo && r.assignedTo.trim() !== "")
        : [];

      setRows(assignedOnly);
      setTotalRecords(assignedOnly.length);
      logInfo("Filtered assigned records", assignedOnly.length);
    }

  } catch (err) {
    logError("Search error", err);
  } finally {
    logInfo("Search execution time (ms)", Date.now() - startTime);
logSuccess("Search completed");
    setLoading(false);
  }
};

  useEffect(() => {

    logInfo("Fetching assigned users", {
  cluster: selectedCluster,
  branch: selectedBranch
});

  fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      cluster: isRegionalManager ? userCluster : selectedCluster || "",
      branchName: isBranchManager ? userBranch : selectedBranch || ""
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => {
      logSuccess("Assigned users fetched", data);
      setAssignedUsers(Array.isArray(data) ? data : []);
    })
    .catch(err => {
      logError("Assigned users fetch error", err);
      setAssignedUsers([]);
    });
}, [selectedCluster, selectedBranch, isRegionalManager, isBranchManager, userCluster, userBranch]);


  useEffect(() => {
    logInfo("Fetching products");
  fetch("https://mobile.coastal.bank.in:5001/api/products")
    .then(res => res.json())
    .then(data => {
  logSuccess("Products fetched", data);
  setProducts(data);
})
    .catch(err => logError("Product fetch error", err));
}, []);


  useEffect(() => {
    logInfo("Fetching clusters");
  fetch("https://mobile.coastal.bank.in:5001/api/clusters")
    .then(res => res.json())
    .then(data => {
  logSuccess("Clusters fetched", data);
  setClusters(data);
})
    .catch(err => logError("Cluster fetch error", err));
}, []);

useEffect(() => {

  let clusterToUse = selectedCluster;

  // 🔒 Regional Manager should always use their own cluster
  if (isRegionalManager) {
    clusterToUse = userCluster;
  }

  let url = "https://mobile.coastal.bank.in:5001/api/branches";

  if (clusterToUse) {
    url =
      clusterToUse === "Corporate Office"
        ? "https://mobile.coastal.bank.in:5001/api/branches"
        : `https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(clusterToUse)}`;
  }

  setLoadingBranches(true);

  logInfo("Fetching branches", url);
  fetch(url)
    .then(res => res.json())
    .then(data => {
  logSuccess("Branches fetched", data);
  setBranches(data);
})
    .catch(err => logError("Branch fetch error", err))
    .finally(() => setLoadingBranches(false));

}, [selectedCluster, isRegionalManager, userCluster]);

useEffect(() => {

  if (isBranchManager) {
    setSelectedCluster(userCluster);
    setSelectedBranch(userBranch);
  }

  if (isRegionalManager) {
    setSelectedCluster(userCluster);
  }

}, [isBranchManager, isRegionalManager, userCluster, userBranch]);

const totalPages = Math.max(
  1,
  Math.ceil(rows.length / ROWS_PER_PAGE)
);

const indexOfLastRecord = currentPage * ROWS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - ROWS_PER_PAGE;

const safeRows = Array.isArray(rows) ? rows : [];
const paginatedRows = safeRows.slice(indexOfFirstRecord, indexOfLastRecord);

const firstRecord = rows.length === 0 ? 0 : indexOfFirstRecord + 1;
const lastRecord = Math.min(indexOfLastRecord, rows.length);

const handleDownloadPDF = async () => {
  logInfo("PDF download triggered", selectedRows);

  if (selectedRows.length === 0) {
    alert("Select records to generate PDF");
    return;
  }

  try {
    logInfo("Calling PDF API", {
  selectedRows,
  selectedColumns,
  fileName
});
    const response = await fetch(
      "https://mobile.coastal.bank.in:5001/api/activity-status/export-pdf",
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          selectedIds: selectedRows,
          columns: selectedColumns,
          fileName
        })
      }
    );

    if (!response.ok) {
  logError("PDF generation failed", response.status);
  alert("Failed to generate PDF");
  return;
}

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
    logSuccess("PDF generated successfully");
    setShowPrintModal(false);

  } catch (err) {
    logError("PDF error", err);
  }
};


// =============================
// HANDLE REACTIVATE
// =============================
const handleReactivate = async () => {
  logInfo("Reactivate triggered", selectedRows);

  if (selectedRows.length === 0) {
    alert("Select accounts to Reactivate");
    return;
  }

  try {
    logInfo("Calling Reactivate API");
    const res = await fetch(
      "https://mobile.coastal.bank.in:5001/api/activity-status/action",
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          actionType: "reactivate",
          selectedIds: selectedRows
        })
      }
    );

    if (!res.ok) {
  logError("Reactivate API failed", res.status);
  throw new Error("API failed");
}

    const data = await res.json();
    logSuccess("Reactivate success", data);
    alert(data.message);

    setSelectedRows([]);
    handleSearch(); // ✅ Always go through Search

  } catch (err) {
    logError("Reactivate error", err);
  }
};

const selectedUserName =
  rows.find(r =>
    selectedRows.includes(String(r.loanAccountNumber))
  )?.assignedTo || "User";

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Filters */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        <Input
  label="Mobile Number"
  value={mobileNumber}
  onChange={(e) => setMobileNumber(e.target.value)}
/>

        <Select
  label="Cluster"
  value={selectedCluster}
  onChange={(e) => {
    if (isBranchManager) return;
    setSelectedCluster(e.target.value);
  }}
  disabled={isBranchManager || isRegionalManager}
>
  <option value="">Select</option>
  <option value="Corporate Office">Corporate Office</option>

  {clusters.map((c, i) => (
    <option key={i} value={c.cluster_name}>
      {c.cluster_name}
    </option>
  ))}
</Select>

       <Select
  label="Branch Name"
  value={selectedBranch}
  onChange={(e) => {
    if (isBranchManager) return;
    setSelectedBranch(e.target.value);
  }}
  disabled={isBranchManager}
>

  <option value="">
    {loadingBranches ? "Loading..." : "Select"}
  </option>

  {branches.map((b) => (
    <option key={b.branch_code} value={b.branch_name}>
      {b.branch_name}
    </option>
  ))}
</Select>

        <Select
  label="Product"
  value={selectedProduct}
  onChange={(e) => setSelectedProduct(e.target.value)}
>
  <option value="">Select</option>

  {products.map((p, i) => (
    <option key={i} value={p.product}>
      {p.product}
    </option>
  ))}
</Select>
        <Select
  label="Assigned To"
  value={selectedAssignedTo}
  onChange={(e) => setSelectedAssignedTo(e.target.value)}
>

  <option value="">Select</option>

  {assignedUsers.map((u) => (
    <option key={u.userId} value={u.userId}>
      {u.name}
    </option>
  ))}
</Select>

        <Input
  label="Pincode"
  value={pincode}
  onChange={(e) => setPincode(e.target.value)}
/>

        <Input
  label="Loan A/C Number"
  value={loanAccount}
  onChange={(e) => setLoanAccount(e.target.value)}
/>

        <Select
  label="Queue"
  value={queue}
  onChange={(e) => setQueue(e.target.value)}
>
  <option value="">Select</option>
  <option value="Marketing">Marketing</option>
  <option value="NPA">NPA</option>
  <option value="Welcome Call">Welcome Call</option>
</Select>

        <Select
  label="DPD Queue"
  value={dpdQueue}
  onChange={(e) => setDpdQueue(e.target.value)}
>
  <option value="">Select</option>
  <option value="0-30">0-30 Days</option>
  <option value="31-60">31-60 Days</option>
  <option value="61-90">61-90 Days</option>
  <option value="90+">Above 90 Days</option>
</Select>

        <Input
  label="Member Name"
  value={memberName}
  onChange={(e) => setMemberName(e.target.value)}
/>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button
  className="px-4 py-2 bg-slate-200 rounded"
  onClick={handleReset}
>
  Reset
</button>

        <button
  onClick={handleSearch}
  className="px-4 py-2 bg-primary text-white rounded"
>
  Search
</button>
        <button
  className="px-4 py-2 bg-slate-100 rounded"
  onClick={() => {

    if (rows.length === 0) {
      alert("No records available to generate PDF");
      return;
    }

    if (selectedRows.length === 0) {
      alert("Select records to generate PDF");
      return;
    }

    setShowPrintModal(true);
  }}
>
  Print Documents
</button>

        <button
  onClick={() => {
  setSelectedActionType("past");
  setRows([]);            // ✅ clear old data
  setHasSearched(false);  // ✅ reset UI
}}
  className={`px-4 py-2 rounded ${
    selectedActionType === "past"
      ? "bg-blue-600 text-white"
      : "bg-slate-100"
  }`}
>
  Past Schedule ℹ️
</button>

        <button
  onClick={() => {
  setSelectedActionType("future");
  setRows([]);
  setHasSearched(false);
}}
  className={`px-4 py-2 rounded ${
    selectedActionType === "future"
      ? "bg-blue-600 text-white"
      : "bg-slate-100"
  }`}
>
  Future Schedule ℹ️
</button>

  {isAdmin && (
  <button
    onClick={() => {
  setSelectedActionType("completed");
  setRows([]);
  setHasSearched(false);
}}
    className={`px-4 py-2 rounded ${
      selectedActionType === "completed"
        ? "bg-blue-600 text-white"
        : "bg-slate-100"
    }`}
  >
    Completed Activities ℹ️
  </button>
)}


        <button
  onClick={() => {
    if (!["past", "future"].includes(selectedActionType)) {
      alert("Re-Activate works only for Past or Future Schedule");
      return;
    }

    if (selectedRows.length === 0) {
      alert("Select accounts to Reactivate");
      return;
    }

    setShowReactivateModal(true);
  }}
  disabled={!["past", "future"].includes(selectedActionType)}
  className={`px-4 py-2 rounded text-white ${
    ["past", "future"].includes(selectedActionType)
      ? "bg-green-600"
      : "bg-gray-400 cursor-not-allowed"
  }`}
>
  Re-Activate
</button>

      </div>

      <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
  <input
    type="checkbox"
    checked={
      rows.length > 0 &&
      selectedRows.length === rows.length
    }
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedRows(
          rows.map(r => String(r.loanAccountNumber))
        );
      } else {
        setSelectedRows([]);
      }
    }}
  />
  Select all records from all pages
</div>

      {hasSearched && (
  <div className="mb-3 text-sm font-semibold text-slate-700">
    No. of Records Fetched:{" "}
    <span className="text-blue-600">{totalRecords}</span>
  </div>
)}

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="min-w-[1200px] w-full text-sm border border-slate-300">
          <thead className="bg-slate-50">
  <tr>

    <th className="p-3 border border-slate-300 text-left">
      <input
        type="checkbox"
        checked={
          paginatedRows.length > 0 &&
          paginatedRows.every(r =>
            selectedRows.includes(String(r.loanAccountNumber))
          )
        }
        onChange={(e) => {
          const checked = e.target.checked;
          const pageIDs = paginatedRows.map(r =>
            String(r.loanAccountNumber)
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

    <th className="p-3 border border-slate-300 text-left">S. No.</th>
    <th className="p-3 border border-slate-300 text-left">Member Name</th>
    <th className="p-3 border border-slate-300 text-left">Loan A/c #</th>
    <th className="p-3 border border-slate-300 text-left">Mobile Number</th>
    <th className="p-3 border border-slate-300 text-left">Branch Name</th>
    <th className="p-3 border border-slate-300 text-left">Assigned To</th>

    {hasSearched && (
      <>
        <th className="p-3 border border-slate-300 text-left">Attachments</th>
        <th className="p-3 border border-slate-300 text-left">Activity Date & Time</th>
        <th className="p-3 border border-slate-300 text-left">Details</th>
      </>
    )}
  </tr>
</thead>

          <tbody>
  {loading ? (
    <tr>
      <td colSpan={hasSearched ? 10 : 7} className="p-6 text-center">
        Loading...
      </td>
    </tr>
  ) : !hasSearched ? (
    <tr>
      <td colSpan={7} className="p-6 text-center text-slate-400">
        Please apply filters and search
      </td>
    </tr>
  ) : rows.length === 0 ? (
    <tr>
      <td colSpan={10} className="p-6 text-center text-slate-400">
        No records found
      </td>
    </tr>
  ) : (
    paginatedRows.map((row, i) => {
      const serialNumber =
        (currentPage - 1) * ROWS_PER_PAGE + i + 1;

  return (
    <tr key={i}>
      <td className="p-3 border border-slate-300">
        <input
          type="checkbox"
          checked={selectedRows.includes(String(row.loanAccountNumber))}
          onChange={(e) => {
            const id = String(row.loanAccountNumber);

            if (e.target.checked) {
              setSelectedRows(prev =>
                [...new Set([...prev, id])]
              );
            } else {
              setSelectedRows(prev =>
                prev.filter(rid => rid !== id)
              );
            }
          }}
        />
      </td>

      <td className="p-3 border border-slate-300">
        {serialNumber}
      </td>

      <td className="p-3 border border-slate-300">
        {row.memberName || "-"}
      </td>

      <td className="p-3 border border-slate-300">
        {row.loanAccountNumber || "-"}
      </td>

      <td className="p-3 border border-slate-300">
        {row.mobileNumber || "-"}
      </td>

      <td className="p-3 border border-slate-300">
        {row.branchName || "-"}
      </td>

      <td className="p-3 border border-slate-300">
        {row.assignedTo || "-"}
      </td>

      {hasSearched && (
        <>
          <td className="p-3 border border-slate-300">
            <button className="text-blue-600 underline">
              View Attachment
            </button>
          </td>

          <td className="p-3 border border-slate-300">
            {row.activityDateTime || "-"}
          </td>

          <td className="p-3 border border-slate-300">
            <button
              className="text-blue-600 underline"
              onClick={() => openDetailsModal(row)}
            >
              View Details
            </button>
          </td>
        </>
      )}
    </tr>
  );
})
  )}
</tbody>
        </table>
      </div>

      {/* Pagination */}
{rows.length > 0 && (
  <div className="flex items-center justify-between mt-4 text-sm text-slate-600">

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
      {/* 🔵 Activity Details Modal */}
{showDetailsModal && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white w-[85%] max-w-5xl rounded-lg shadow-lg">

      {/* Header */}
      <div className="px-6 py-4 border-b text-lg font-semibold">
        Activity Details
      </div>

      {/* Scrollable table */}
      <div className="p-4 max-h-[60vh] overflow-y-auto relative">
  <table className="w-full text-sm border border-collapse relative">
         <thead className="sticky top-0 z-20">
<tr>
  <th className="p-2 text-left bg-slate-100 border border-slate-300">Activity Date</th>
  <th className="p-2 text-left bg-slate-100 border border-slate-300">Activity Time</th>
  <th className="p-2 text-left bg-slate-100 border border-slate-300">User Name</th>
  <th className="p-2 text-left bg-slate-100 border border-slate-300">Activity Type</th>
  <th className="p-2 text-left bg-slate-100 border border-slate-300">Activity Status</th>
  <th className="p-2 text-left bg-slate-100 border border-slate-300">Notes</th>
</tr>
</thead>

          <tbody className="bg-white relative z-10">
            {detailsLoading ? (
              <tr>
                <td colSpan="6" className="p-4 text-center">Loading...</td>
              </tr>
            ) : activityDetails.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-400">
                  No activity found
                </td>
              </tr>
            ) : (
              Array.isArray(activityDetails) &&
              activityDetails.map((d, i) => (

                <tr key={i}>
  <td className="p-2 border border-slate-300">{d.activityDate}</td>
  <td className="p-2 border border-slate-300">{d.activityTime}</td>
  <td className="p-2 border border-slate-300">{d.userName}</td>
  <td className="p-2 border border-slate-300">{d.activityType}</td>
  <td className="p-2 border border-slate-300 whitespace-pre-line">{d.activityStatus}</td>
  <td className="p-2 border border-slate-300 whitespace-pre-line">{d.notes}</td>
</tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-end p-4 border-t">
        <button
          onClick={() => setShowDetailsModal(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

{showPrintModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[500px] rounded-xl shadow-lg p-6">

      <h2 className="text-lg font-semibold mb-4">Export Grid</h2>

      <label className="text-sm">Filename</label>
      <input
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        className="w-full mt-1 mb-4 px-3 py-2 border rounded"
      />

      <div className="max-h-48 overflow-y-auto border p-3 rounded mb-4">
        {allColumns.map(col => (
          <div key={col.key} className="flex items-center gap-2 mb-2">
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
            <span>{col.label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowPrintModal(false)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Download PDF
        </button>
      </div>

    </div>
  </div>
)}

{/* 🔵 Reactivate Confirmation Modal */}
{showReactivateModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[420px] rounded-xl shadow-lg p-6">

      <h2 className="text-lg font-semibold mb-4 text-center">
        Confirmation
      </h2>

      <p className="text-sm text-slate-600 text-center mb-6">
        Do you want to Re-Activate{" "}
        <span className="font-semibold">
          {selectedRows.length}
        </span>{" "}
        account(s) to{" "}
        <span className="font-semibold text-blue-600">
          {selectedUserName}
        </span>
        ?
      </p>

      <div className="flex justify-center gap-4">

        <button
          onClick={() => setShowReactivateModal(false)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            setShowReactivateModal(false);
            await handleReactivate();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          OK
        </button>

      </div>

    </div>
  </div>
)}

    </div>
  );
};


/* Reusable Inputs */
const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <input
      value={value}
      onChange={onChange}
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
    />
  </div>
);

const Select = ({ label, children, value, onChange, disabled }) => (
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
      {children}
    </select>
  </div>
);

export default ActivityStatus;
