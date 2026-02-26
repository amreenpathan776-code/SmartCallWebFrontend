import { useEffect, useState } from "react";

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
  // Clear filters
  setMobileNumber("");
  setPincode("");
  setLoanAccount("");
  setMemberName("");

  setSelectedCluster("");
  setSelectedBranch("");
  setSelectedProduct("");
  setSelectedAssignedTo("");

  // Clear dependent data
  setBranches([]);
  setAssignedUsers([]);
  setQueue("");
  setDpdQueue("");


  // Reset table
  setRows([]);
  setTotalRecords(0);
  setHasSearched(false);
  setLoading(false);
  setSelectedActionType("");
};

 const openDetailsModal = async (row) => {
  if (!row.loanAccountNumber) return;

  setShowDetailsModal(true);
  setDetailsLoading(true);
  setActivityDetails([]);

  try {
    const res = await fetch(
      "http://40.80.79.26:5001/api/activity-details",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanAccountNumber: row.loanAccountNumber
        })
      }
    );

    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    setActivityDetails(Array.isArray(data) ? data : []);

  } catch (err) {
    console.error("Activity details error", err);
    setActivityDetails([]);
  } finally {
    setDetailsLoading(false);
  }
};

 const handleSearch = async () => {

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

  if (!hasAnyFilter && !selectedActionType) {
    alert("Please select at least one filter or action before searching");
    return;
  }

  setLoading(true);
  setHasSearched(true);
  setCurrentPage(1);

  try {

    // 🔵 IF action button selected → call action API
    if (selectedActionType) {

      const res = await fetch(
        "http://40.80.79.26:5001/api/activity-status/action",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      const data = await res.json();

      setRows(Array.isArray(data) ? data : []);
      setTotalRecords(Array.isArray(data) ? data.length : 0);
    }

    // 🔵 ELSE → normal search
    else {

      const res = await fetch(
        "http://40.80.79.26:5001/api/activity-status/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      const data = await res.json();

      const assignedOnly = Array.isArray(data)
        ? data.filter(r => r.assignedTo && r.assignedTo.trim() !== "")
        : [];

      setRows(assignedOnly);
      setTotalRecords(assignedOnly.length);
    }

  } catch (err) {
    console.error("Search error", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  fetch("http://40.80.79.26:5001/api/assignUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cluster: selectedCluster || "",
      branchName: selectedBranch || ""
    })
  })
    .then(res => res.json())
    .then(data => setAssignedUsers(data))
    .catch(err => console.error("Assigned users fetch error", err));

}, [selectedCluster, selectedBranch]);


  useEffect(() => {
  fetch("http://40.80.79.26:5001/api/products")
    .then(res => res.json())
    .then(data => setProducts(data))
    .catch(err => console.error("Product fetch error", err));
}, []);


  useEffect(() => {
  fetch("http://40.80.79.26:5001/api/clusters")
    .then(res => res.json())
    .then(data => setClusters(data))
    .catch(err => console.error("Cluster fetch error", err));
}, []);

useEffect(() => {
  let url = "http://40.80.79.26:5001/api/branches";

  if (selectedCluster) {
    url =
      selectedCluster === "Corporate Office"
        ? "http://40.80.79.26:5001/api/branches"
        : `http://40.80.79.26:5001/api/branches/${encodeURIComponent(selectedCluster)}`;
  }

  setLoadingBranches(true);

  fetch(url)
    .then(res => res.json())
    .then(data => setBranches(data))
    .catch(err => console.error("Branch fetch error", err))
    .finally(() => setLoadingBranches(false));

}, [selectedCluster]);

const totalPages = Math.max(
  1,
  Math.ceil(rows.length / ROWS_PER_PAGE)
);

const indexOfLastRecord = currentPage * ROWS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - ROWS_PER_PAGE;

const safeRows = Array.isArray(rows) ? rows : [];
const paginatedRows = safeRows.slice(indexOfFirstRecord, indexOfLastRecord);

const handleDownloadPDF = async () => {

  if (selectedRows.length === 0) {
    alert("Select records to generate PDF");
    return;
  }

  try {
    const response = await fetch(
      "http://40.80.79.26:5001/api/activity-status/export-pdf",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIds: selectedRows,
          columns: selectedColumns,
          fileName
        })
      }
    );

    if (!response.ok) {
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
    setShowPrintModal(false);

  } catch (err) {
    console.error("PDF error:", err);
  }
};


// =============================
// HANDLE ACTION BUTTONS
// =============================
const handleAction = async (type) => {

  setLoading(true);
  setHasSearched(true);
  setCurrentPage(1);

  try {
    const res = await fetch(
      "http://40.80.79.26:5001/api/activity-status/action",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  actionType: type,
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

    const data = await res.json();

    setRows(Array.isArray(data) ? data : []);
    setTotalRecords(Array.isArray(data) ? data.length : 0);

  } catch (err) {
    console.error("Action error:", err);
  } finally {
    setLoading(false);
  }
};

// =============================
// HANDLE REACTIVATE
// =============================
const handleReactivate = async () => {

  if (selectedRows.length === 0) {
    alert("Select accounts to Reactivate");
    return;
  }

  try {
    const res = await fetch(
      "http://40.80.79.26:5001/api/activity-status/action",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "reactivate",
          selectedIds: selectedRows
        })
      }
    );

    const data = await res.json();
    alert(data.message);

    setSelectedRows([]);
    if (selectedActionType) {
  handleAction(selectedActionType);
} else {
  handleSearch();
}

  } catch (err) {
    console.error("Reactivate error:", err);
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
  setSelectedCluster(e.target.value);
}}
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
  onChange={(e) => setSelectedBranch(e.target.value)}
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
    handleAction("past");
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
    handleAction("future");
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
  onClick={() => {
    setSelectedActionType("completed");
    handleAction("completed");
  }}
  className={`px-4 py-2 rounded ${
    selectedActionType === "completed"
      ? "bg-blue-600 text-white"
      : "bg-slate-100"
  }`}
>
  Completed Activities ℹ️
</button>


        <button
  onClick={() => {
    if (selectedRows.length === 0) {
      alert("Select accounts to Reactivate");
      return;
    }
    setShowReactivateModal(true);
  }}
  className="px-4 py-2 bg-green-600 text-white rounded"
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
) : rows.length === 0 ? (
  <tr>
    <td colSpan={hasSearched ? 10 : 7} className="p-6 text-center text-slate-400">
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

    <div>
      Page {currentPage} of {totalPages}
    </div>

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
    <th className="p-2 text-left bg-slate-100 border-b">Activity Date</th>
    <th className="p-2 text-left bg-slate-100 border-b">Activity Time</th>
    <th className="p-2 text-left bg-slate-100 border-b">User Name</th>
    <th className="p-2 text-left bg-slate-100 border-b">Activity Type</th>
    <th className="p-2 text-left bg-slate-100 border-b">Activity Status</th>
    <th className="p-2 text-left bg-slate-100 border-b">Notes</th>
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

                <tr key={i} className="border-t">
                  <td className="p-2">{d.activityDate}</td>
                  <td className="p-2">{d.activityTime}</td>
                  <td className="p-2">{d.userName}</td>
                  <td className="p-2">{d.activityType}</td>
                  <td className="p-2 whitespace-pre-line">
  {d.activityStatus}
</td>
                  <td className="p-2 whitespace-pre-line">{d.notes}</td>
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
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100 disabled:opacity-50"
    >
      {children}
    </select>
  </div>
);

export default ActivityStatus;
