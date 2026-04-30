import { useEffect, useState, useRef, useCallback } from "react";

const Transaction = () => {
const [selectedRows, setSelectedRows] = useState([]);
const [selectAllCurrentPage, setSelectAllCurrentPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);


  const [filters, setFilters] = useState({
    mobileNumber: "",
    cluster: "",
    pincode: "",
    branchName: "",
    product: "",
    assignedTo: "",
    loanAccount: "",
    queue: "",
    dpdQueue: "",
    memberName: ""
  });

  const [records, setRecords] = useState([]);
  const [recordCount, setRecordCount] = useState(0);

  const role = localStorage.getItem("role");
const userId = localStorage.getItem("userId");
const userBranch = localStorage.getItem("branchName");
const userCluster = localStorage.getItem("clusterName");

const isBranchManager = role === "Branch Manager";
const isRegionalManager = role?.startsWith("Regional Manager");

  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  const [assignUsers, setAssignUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [showDetails, setShowDetails] = useState(false);
  const [viewDetailsData, setViewDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const selectedUserRef = useRef("");
  const [assigning, setAssigning] = useState(false);

  const [showPrintModal, setShowPrintModal] = useState(false);
const [fileName, setFileName] = useState("Transaction_Report");

const allColumns = [
  { key: "serialNumber", label: "S. No." },
  { key: "firstName", label: "First Name" },
  { key: "accountNumber", label: "Account Number" },
  { key: "product", label: "Product" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "branch", label: "Branch" },
  { key: "status", label: "Status" }
];

const [selectedColumns, setSelectedColumns] = useState(
  allColumns.map(col => col.key)
);

const fetchAssignUsers = useCallback((branchName, cluster) => {

console.log("📡 [AssignUsers API] Request:", { branchName, cluster });

  fetch("https://mobile.coastal.bank.in:5001/api/assignUsers/v2", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": userId
    },
    body: JSON.stringify({ branchName, cluster })
  })
    .then(res => res.json())
    .then(data => {

console.log("✅ [AssignUsers API] Success:", data);

  if (Array.isArray(data)) {
    setAssignUsers(data);
  } else {
    setAssignUsers([]);
    console.error("AssignUsers API returned non-array:", data);
  }
})
    .catch(err => console.error("❌ AssignUsers API Error:", err));
}, [userId]);

useEffect(() => {

  if (isBranchManager) {
    fetchAssignUsers(userBranch, userCluster);
  } 
  else if (isRegionalManager) {
    fetchAssignUsers("", userCluster);
  } 
  else {
    fetchAssignUsers("", "");
  }

}, [fetchAssignUsers, isBranchManager, isRegionalManager, userBranch, userCluster]);

  const handleViewDetails = async (accountNumber) => {
    console.log("👁 View Details clicked:", accountNumber);
  try {
    setLoadingDetails(true);
    setShowDetails(true);


console.log("📡 Calling View Details API...");
    const res = await fetch(
  `https://mobile.coastal.bank.in:5001/api/transaction/details/${accountNumber}`,
  {
    headers: {
      "x-user-id": localStorage.getItem("userId")
    }
  }
);

    const data = await res.json();
    console.log("✅ View Details Success:", data);
    setViewDetailsData(data);
  } catch (err) {
    console.error("❌ View Details Error:", err);
  } finally {
    setLoadingDetails(false);
  }
};

  useEffect(() => {
  fetch("https://mobile.coastal.bank.in:5001/api/clusters")
    .then((res) => res.json())
    .then((data) => {
      setClusters([
        { cluster_name: "Corporate Office" },
        ...data
      ]);
    })
    .catch((err) => console.error("Cluster fetch error:", err));
}, []);

useEffect(() => {
  fetch("https://mobile.coastal.bank.in:5001/api/branches")
    .then((res) => res.json())
    .then((data) => {
      const filtered = data.filter(
        b => b.branch_name !== "Corporate Office"
      );
      setBranches(filtered);
    })
    .catch((err) => console.error("Initial branch fetch error:", err));
}, []);

useEffect(() => {
  fetch("https://mobile.coastal.bank.in:5001/api/products")
    .then((res) => res.json())
    .then((data) => setProducts(data))
    .catch((err) => console.error("Product fetch error:", err));
}, []);


useEffect(() => {

  // Branch Manager restriction
  if (isBranchManager) {
    setFilters(prev => ({
      ...prev,
      cluster: userCluster,
      branchName: userBranch
    }));

    fetchAssignUsers(userBranch, userCluster);
  }

  // Regional Manager restriction
  if (isRegionalManager) {

    setFilters(prev => ({
      ...prev,
      cluster: userCluster
    }));

    // Load branches under that cluster
    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(userCluster)}`)
      .then(res => res.json())
      .then(data => setBranches(data));

    fetchAssignUsers("", userCluster);
  }

}, [isBranchManager, isRegionalManager, userBranch, userCluster, fetchAssignUsers]);

const handleClusterChange = (e) => {
  console.log("🌍 Cluster changed:", e.target.value);
  const cluster = e.target.value;

  setFilters(prev => ({ ...prev, cluster, branchName: "" }));
  setBranches([]);
  setAssignUsers([]);   // clear previous users
  selectedUserRef.current = "";
  setSelectedUserId("");

  if (!cluster) {
    fetchAssignUsers("", "");
    return;
  }

  console.log("📡 Fetching branches for cluster:", cluster);
  // Load branches under cluster
  fetch(`https://mobile.coastal.bank.in:5001/api/branches/${encodeURIComponent(cluster)}`)
    .then(res => res.json())
    .then(data => {
  console.log("✅ Branches loaded:", data);
  setBranches(data);
});

  // Load cluster users
  fetchAssignUsers("", cluster);
};

const handleSearch = () => {

  console.log("🔍 Search clicked with filters:", filters);
  // Check if at least one filter has a value
  const hasAnyFilter = Object.values(filters).some(
    (value) => value !== "" && value !== null
  );

  if (!hasAnyFilter) {
    console.warn("❌ No filters selected");
    alert("Please select at least one filter before searching");
    return;
  }

  // 🚫 Block Marketing & Welcome Call (show no data)
if (filters.queue === "Marketing" || filters.queue === "Welcome Call") {
  console.warn("❌ Blocked queue selected:", filters.queue);
  setRecords([]);
  setRecordCount(0);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllCurrentPage(false);
  setSelectAllAllPages(false);
  return; // ❌ stop API call
}

console.log("📡 Calling Search API...");
  fetch("https://mobile.coastal.bank.in:5001/api/transaction/search", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "x-user-id": userId
  },
  body: JSON.stringify(filters),
})
    .then((res) => res.json())
    .then((data) => {
      console.log("✅ Search API Success:", data);
      setRecords(data);
      setRecordCount(data.length);
      setSelectedRows([]);
      setSelectAllCurrentPage(false);
      setSelectAllAllPages(false);
      setCurrentPage(1);
    })
    .catch((err) => console.error("❌ Search API Error:", err));
};

const indexOfLastRecord = currentPage * recordsPerPage;
const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
const safeRecords = Array.isArray(records) ? records : [];
const currentRecords = safeRecords.slice(indexOfFirstRecord, indexOfLastRecord);

const totalPages = Math.max(1, Math.ceil(records.length / recordsPerPage));

const handleReset = () => {

  if (isBranchManager) {

    setFilters({
      mobileNumber: "",
      cluster: userCluster,
      pincode: "",
      branchName: userBranch,
      product: "",
      assignedTo: "",
      loanAccount: "",
      queue: "",
      dpdQueue: "",
      memberName: ""
    });

    fetchAssignUsers(userBranch, userCluster);

  } 

  else if (isRegionalManager) {

    setFilters({
      mobileNumber: "",
      cluster: userCluster,
      pincode: "",
      branchName: "",
      product: "",
      assignedTo: "",
      loanAccount: "",
      queue: "",
      dpdQueue: "",
      memberName: ""
    });

    fetchAssignUsers("", userCluster);

  } 

  else {

    setFilters({
      mobileNumber: "",
      cluster: "",
      pincode: "",
      branchName: "",
      product: "",
      assignedTo: "",
      loanAccount: "",
      queue: "",
      dpdQueue: "",
      memberName: ""
    });

    fetchAssignUsers("", "");
  }

  setRecords([]);
  setRecordCount(0);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllCurrentPage(false);
  setSelectAllAllPages(false);
};


const dpdOptions = [
  { value: "0-30", label: "0-30 Days" },
  { value: "31-60", label: "31-60 Days" },
  { value: "61-90", label: "61-90 Days" },
  { value: "90+", label: "Above 90 Days" }
];

const queueOptions = [
  { value: "Marketing", label: "Marketing" },
  { value: "NPA", label: "NPA" },
  { value: "Welcome Call", label: "Welcome Call" }
];

const handleAssign = async () => {
  console.log("📌 Assign clicked", {
  selectedRows,
  assignedTo: selectedUserRef.current
});
  if (assigning) return;


  if (selectedRows.length === 0) {
    console.warn("❌ No rows selected");
    alert("Select accounts first");
    return;
  }

  
  if (!selectedUserRef.current) {
    console.warn("❌ No user selected");
    alert("Select user to assign");
    return;
  }

  setAssigning(true);

  try {
    console.log("📡 Calling Assign API...");
    const payload = {
  loanIds: selectedRows,
  assignedToUserId: selectedUserRef.current,
  assignedByAdminId: localStorage.getItem("userId")
};

    const res = await fetch("https://mobile.coastal.bank.in:5001/api/assign", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userId") // 🔥 this is key
  },
  body: JSON.stringify(payload)
});


    const data = await res.json();
    console.log("✅ Assign Success:", data);
    alert(data.message);

    setSelectedRows([]);
    setSelectAllCurrentPage(false);
    setSelectAllAllPages(false);

    handleSearch();
  } catch (err) {
    console.error("❌ Assign Error:", err);
    alert("Assignment failed");
  } finally {
    setAssigning(false);
  }
};

const handleDownloadPDF = async () => {
  console.log("📄 PDF Download clicked", {
  selectedRows,
  selectedColumns
});
  
 if (records.length === 0) {
  console.warn("❌ No records for PDF");
  alert("No records available to generate PDF");
  return;
}

if (selectedRows.length === 0) {
  alert("Select records to generate PDF");
  return;
}

  try {

  // 🔴 Safety check
  if (records.length === 0) {
    console.warn("❌ No rows selected for PDF");
    alert("No records available to generate PDF");
    return;
  }

  if (selectedRows.length === 0) {
    alert("Select records to generate PDF");
    return;
  }

  // ✅ Build serial number mapping
  const serialData = selectedRows.map((id) => {
    const index = records.findIndex(
      r => r.accountNumber === id
    );

    return {
      accountNumber: id,
      serialNumber: index + 1
    };
  });

console.log("📡 Calling PDF API...");
  const response = await fetch(
    "https://mobile.coastal.bank.in:5001/api/transaction/export-pdf",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        selectedIds: selectedRows,
        columns: selectedColumns,
        fileName: fileName,
        serialData: serialData   // 🔥 IMPORTANT
      })
    }
  );

  if (!response.ok) {
    console.error("❌ PDF API Failed");
    alert("Failed to generate PDF");
    return;
  }

console.log("✅ PDF Generated Successfully");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName || "Transaction_Report"}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
    setShowPrintModal(false);

  } catch (err) {
    console.error("❌ PDF Error:", err);
  }
};


  return (
    <main className="flex-1 p-6 bg-slate-100">
      <div className="bg-white rounded-xl shadow p-6">
        {/* Filters Section */}
        <div className="grid grid-cols-4 gap-6 mb-6">

  <Input
  label="Mobile Number"
  value={filters.mobileNumber}
  onChange={(e) => setFilters({ ...filters, mobileNumber: e.target.value })}
/>


  <Select 
  label="Cluster"
  options={clusters}
  valueKey="cluster_name"
  labelKey="cluster_name"
  value={filters.cluster}
  onChange={(e) => {
  if (isBranchManager || isRegionalManager) return;

  setFilters({ ...filters, cluster: e.target.value });
  handleClusterChange(e);
}}
  disabled={isBranchManager || isRegionalManager}
  boldValue={isBranchManager || isRegionalManager}  // ✅ makes text bold
/>

  <Input 
  label="Pincode"
  value={filters.pincode}
  onChange={(e) => setFilters({ ...filters, pincode: e.target.value })}
/>

  <Select
  label="Branch Name"
  options={branches}
  valueKey="branch_name"
  labelKey="branch_name"
  value={filters.branchName}
  onChange={(e) => {
  if (isBranchManager) return;

  const branch = e.target.value;

  selectedUserRef.current = "";
  setSelectedUserId("");

  setFilters(prev => ({
    ...prev,
    branchName: branch
  }));

  fetchAssignUsers(branch, filters.cluster);
}}
  disabled={isBranchManager}
  boldValue={isBranchManager}   // ✅ makes text bold
/>

  <Select 
  label="Product"
  options={products}
  valueKey="product"
  labelKey="product"
  value={filters.product}
  onChange={(e) => setFilters({ ...filters, product: e.target.value })}
/>


  <Select
  label="Assigned To"
  options={assignUsers}
  valueKey="userId"
  labelKey="name"
  value={filters.assignedTo}
  onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
/>

  <Input 
  label="Loan A/C Number"
  value={filters.loanAccount}
  onChange={(e) => setFilters({ ...filters, loanAccount: e.target.value })}
/>


  <Select 
  label="Queue"
  options={queueOptions}
  valueKey="value"
  labelKey="label"
  value={filters.queue}
  onChange={(e) => setFilters({ ...filters, queue: e.target.value })}
/>

  <Select 
  label="DPD Queue"
  options={dpdOptions}
  valueKey="value"
  labelKey="label"
  value={filters.dpdQueue}
  onChange={(e) => setFilters({ ...filters, dpdQueue: e.target.value })}
/>


  <Input 
  label="Member Name"
  value={filters.memberName}
  onChange={(e) => setFilters({ ...filters, memberName: e.target.value })}
/>

</div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleReset} className="px-4 py-2 bg-slate-200 rounded">
  Reset
</button>

          <button onClick={handleSearch} className="px-4 py-2 bg-primary text-white rounded">
  Search
</button>
          <span className="text-sm text-slate-500">
            No of Records fetched : {recordCount}
          </span>
          <button
  onClick={() => {

  // 🔴 Case 1: No search data
  if (records.length === 0) {
    alert("No records available to generate PDF");
    return;
  }

  // 🔴 Case 2: Data exists but nothing selected
  if (selectedRows.length === 0) {
    alert("Select records to generate PDF");
    return;
  }

  setShowPrintModal(true);
}}
  className="ml-auto px-4 py-2 bg-slate-100 rounded"
>
  Print Documents
</button>

        </div>

        {/* Transaction Table */}
<div className="border rounded-lg overflow-x-auto bg-white">
  <table className="w-full text-sm border border-slate-300">
    <thead className="bg-slate-50">
  <tr className="text-slate-700">
    <th className="p-3 border border-slate-300 text-center">
      <input
        type="checkbox"
        checked={selectAllCurrentPage}
        onChange={(e) => {
          const checked = e.target.checked;
          setSelectAllCurrentPage(checked);

          const pageIDs = currentRecords.map(r => r.accountNumber);

          if (checked) {
            setSelectedRows(prev => [...new Set([...prev, ...pageIDs])]);
          } else {
            setSelectedRows(prev =>
              prev.filter(id => !pageIDs.includes(id))
            );
          }
        }}
      />
    </th>

    {[
      "S. No.",
      "First Name",
      "Account Number",
      "Product",
      "Mobile Number",
      "Branch",
      "Status",
      "Action",
    ].map((h) => (
      <th
        key={h}
        className="p-3 border border-slate-300 text-left font-medium"
      >
        {h}
      </th>
    ))}
  </tr>
</thead>

    <tbody>
  {records.length === 0 && (
    <tr>
      <td colSpan={8} className="p-6 text-center text-slate-400">
        No records found
      </td>
    </tr>
  )}

  {currentRecords.map((row, index) => {
  const serialNumber =
    (currentPage - 1) * recordsPerPage + index + 1;

  return (
    <tr key={index}>
      <td className="p-3 border border-slate-300 text-center">
        <input
          type="checkbox"
          checked={selectedRows.includes(row.accountNumber)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows(prev => [...new Set([...prev, row.accountNumber])]);
            } else {
              setSelectedRows(prev =>
                prev.filter(id => id !== row.accountNumber)
              );
            }
          }}
        />
      </td>

      <td className="p-3 border border-slate-300">{serialNumber}</td>
      <td className="p-3 border border-slate-300">{row.firstName}</td>
      <td className="p-3 border border-slate-300">{row.accountNumber}</td>
      <td className="p-3 border border-slate-300">{row.product}</td>
      <td className="p-3 border border-slate-300">{row.mobileNumber}</td>
      <td className="p-3 border border-slate-300">{row.branch}</td>
      <td className="p-3 border border-slate-300">{row.status}</td>
      <td className="p-3 border border-slate-300">

        <button
          className="text-blue-600 hover:underline"
          onClick={() => handleViewDetails(row.accountNumber)}
        >
          View Details
        </button>
      </td>
    </tr>
  );
})}
</tbody>
  </table>
</div>

{/* Pagination & Select All */}
<div className="flex items-center justify-between mt-4 text-sm text-slate-600">

  {/* Select All */}
  <div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={selectAllAllPages}
    onChange={(e) => {
      const checked = e.target.checked;
      setSelectAllAllPages(checked);

      if (checked) {
        const allIDs = records.map(r => r.accountNumber);
        setSelectedRows(allIDs);
        setSelectAllCurrentPage(true);
      } else {
        setSelectedRows([]);
        setSelectAllCurrentPage(false);
      }
    }}
  />
  <span>Select all records from all pages</span>
</div>

  {/* Pagination */}
  <div className="flex items-center gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() => {
  setCurrentPage(1);
  setSelectAllCurrentPage(false);
}}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ⏮
    </button>

    <button
      disabled={currentPage === 1}
      onClick={() => {
  setCurrentPage(prev => prev - 1);
  setSelectAllCurrentPage(false);
}}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ◀
    </button>

    <span>Page {currentPage} of {totalPages}</span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => {
  setCurrentPage(prev => prev + 1);
  setSelectAllCurrentPage(false);
}}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ▶
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => {
  setCurrentPage(totalPages);
  setSelectAllCurrentPage(false);
}}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ⏭
    </button>
  </div>
</div>

        {/* Assign Section */}
        <div className="flex items-center gap-4 mt-6">
          <Select 
  label="Assign To" 
  options={assignUsers} 
  valueKey="userId" 
  labelKey="name"
  value={selectedUserId}          // ✅ THIS IS REQUIRED
  onChange={(e) => {
    const userId = e.target.value;
    selectedUserRef.current = userId;
    setSelectedUserId(userId);
  }}
/>

          <button
  onClick={handleAssign}
  disabled={assigning}
  className={`flex items-center gap-4 mt-6 px-6 py-2 rounded 
    ${assigning ? "bg-gray-400 cursor-not-allowed" : "bg-primary text-white"}`}
>
  {assigning ? "Assigning..." : "Assign"}
</button>

        </div>
      </div>
      {showDetails && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white w-[900px] rounded-xl shadow-lg p-6 relative">

      {/* Close */}
      <button
        className="absolute top-4 right-4 text-gray-500"
        onClick={() => {
          setShowDetails(false);
          setViewDetailsData(null);
        }}
      >
        ✖
      </button>

      <h2 className="text-xl font-semibold mb-6">
        Transaction Data Detail
      </h2>

      {loadingDetails && (
        <p className="text-sm text-gray-500">Loading...</p>
      )}

      {viewDetailsData && (
        <div className="grid grid-cols-2 gap-6">

          <ReadOnly label="Customer Name" value={viewDetailsData.customerName} />
          <ReadOnly label="Date of Birth" value={viewDetailsData.dob} />

          <ReadOnly label="Gender" value={viewDetailsData.gender} />
          <ReadOnly label="Pan Card Number" value={viewDetailsData.panNumber} />

          <ReadOnly
            label="Address"
            value={viewDetailsData.address}
            textarea
          />
          <ReadOnly label="Pincode" value={viewDetailsData.pincode} />

          <ReadOnly label="Mobile Number" value={viewDetailsData.mobileNumber} />
          <ReadOnly label="Loan Account #" value={viewDetailsData.loanAccountNumber} />

          <ReadOnly
            label="Outstanding Loan Amount"
            value={viewDetailsData.interestDue}
          />
          <ReadOnly label="Interest Due" value={viewDetailsData.principalDue} />

          <ReadOnly label="Principal Due" value={viewDetailsData.outstandingAmount} />
          <ReadOnly label="Interest Rate" value={viewDetailsData.interestRate} />

        </div>
      )}
    </div>
  </div>
)}

{showPrintModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white w-[500px] rounded-xl shadow-lg p-6 relative">

      <button
        className="absolute top-4 right-4 text-gray-500"
        onClick={() => setShowPrintModal(false)}
      >
        ✖
      </button>

      <h2 className="text-lg font-semibold mb-4">Export Grid</h2>

      <label className="text-sm text-slate-600">Filename</label>
      <input
        type="text"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        className="w-full mt-1 mb-4 px-3 py-2 border rounded bg-slate-100"
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
    </main>
  );
};

/* Reusable Inputs */
const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
    />
  </div>
);

const Select = ({
  label,
  options = [],
  valueKey,
  labelKey,
  value,
  onChange,
  disabled = false
}) => (
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
      {Array.isArray(options) &&
        options.map((item, index) => (
          <option key={index} value={item[valueKey]}>
            {item[labelKey]}
          </option>
        ))}
    </select>
  </div>
);


/* ✅ ADD THIS BELOW SELECT */
const ReadOnly = ({ label, value, textarea = false }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>

    {textarea ? (
      <textarea
        value={value || ""}
        disabled
        rows={3}
        className="w-full mt-1 px-3 py-2 border rounded bg-slate-100 resize-none"
      />
    ) : (
      <input
        type="text"
        value={value || ""}
        disabled
        className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
      />
    )}
  </div>
);

export default Transaction;