import { useEffect, useState } from "react";

// ✅ Logger (Same style as reference)
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

const LeadList = () => {
  const [filters, setFilters] = useState({
    memberName: "",
    mobileNumber: "",
    pincode: "",
    cluster: "",
    branch: "",
    product: "",
    assignedTo: "",
    leadType: "",
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
const [assignUser, setAssignUser] = useState("");
const [selectedLead, setSelectedLead] = useState(null);

const role = localStorage.getItem("role");
const userId = localStorage.getItem("userId");
const userBranch = localStorage.getItem("branchName");
const userCluster = localStorage.getItem("clusterName");

const isBranchManager = role === "Branch Manager";
const isRegionalManager = role?.startsWith("Regional Manager");

useEffect(() => {

  if (isBranchManager) {

    setFilters(prev => ({
      ...prev,
      cluster: userCluster,
      branch: userBranch
    }));

    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${userCluster}`)
      .then(res => res.json())
      .then(setBranches);

  }

  if (isRegionalManager) {

    setFilters(prev => ({
      ...prev,
      cluster: userCluster
    }));

    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${userCluster}`)
      .then(res => res.json())
      .then(setBranches);

  }

}, [isBranchManager, isRegionalManager, userCluster, userBranch]);


useEffect(() => {
  logInfo("Calling API: GET /api/clusters");
fetch("https://mobile.coastal.bank.in:5001/api/clusters")
  .then(res => res.json())
  .then(data => {
    logSuccess("Clusters fetched", data);
    setClusters(data);
  })
  .catch(err => logError("Clusters API failed", err));

  logInfo("Calling API: GET /api/products");
fetch("https://mobile.coastal.bank.in:5001/api/products")
  .then(res => res.json())
  .then(data => {
    logSuccess("Products fetched", data);
    setProducts(data);
  })
  .catch(err => logError("Products API failed", err));
}, []);

useEffect(() => {

  if (!filters.cluster) {

    fetch("https://mobile.coastal.bank.in:5001/api/branches")
      .then(res => res.json())
      .then(setBranches);

    return;
  }

  fetch(`https://mobile.coastal.bank.in:5001/api/branches/${filters.cluster}`)
    .then(res => res.json())
    .then(data => {

      setBranches(data);

      if (isBranchManager) {
        setFilters(prev => ({
          ...prev,
          branch: userBranch
        }));
      } else {
        setFilters(prev => ({
          ...prev,
          branch: "",
          assignedTo: ""
        }));
      }

    });

}, [filters.cluster, isBranchManager, userBranch]);


useEffect(() => {

  const branchToUse = isBranchManager
    ? userBranch
    : filters.branch || "";

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
    }),
  })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => {
      logSuccess("Assign Users fetched", data);
      setUsers(Array.isArray(data) ? data : []);
    })
    .catch(err => {
  logError("Assign Users API failed", err);
  setUsers([]);
});

}, [
  filters.branch,
  filters.cluster,
  isBranchManager,
  isRegionalManager,
  userBranch,
  userCluster,
  userId
]);

// ✅ Pagination Logic
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
  const pageIDs = currentRows.map(r => r.mobileNumber);

  const allSelected =
    pageIDs.length > 0 &&
    pageIDs.every(id => selectedRows.includes(id));

  setSelectAllCurrentPage(allSelected);
}, [currentRows, selectedRows]);


const handleReset = () => {

  if (isBranchManager) {

    setFilters({
      memberName: "",
      mobileNumber: "",
      pincode: "",
      cluster: userCluster,
      branch: userBranch,
      product: "",
      assignedTo: "",
      leadType: "",
    });

    logInfo("Calling API: GET /api/branches (by cluster)", userCluster);
    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${userCluster}`)
      .then(res => res.json())
      .then(data => {
  logSuccess("Branches fetched", data);
  setBranches(data);
})
.catch(err => logError("Branches API failed", err));


  } 
  else if (isRegionalManager) {

    setFilters({
      memberName: "",
      mobileNumber: "",
      pincode: "",
      cluster: userCluster,   // ✅ keep cluster
      branch: "",
      product: "",
      assignedTo: "",
      leadType: "",
    });

    fetch(`https://mobile.coastal.bank.in:5001/api/branches/${userCluster}`)
      .then(res => res.json())
      .then(setBranches);

  } 
  else {

    setFilters({
      memberName: "",
      mobileNumber: "",
      pincode: "",
      cluster: "",
      branch: "",
      product: "",
      assignedTo: "",
      leadType: "",
    });

    setBranches([]);

  }

  setRows([]);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllCurrentPage(false);
  setSelectAllAllPages(false);
  setAssignUser("");
};

const handleSearch = async () => {

  const noFilterSelected =
    !filters.memberName &&
    !filters.mobileNumber &&
    !filters.pincode &&
    !filters.cluster &&
    !filters.branch &&
    !filters.product &&
    !filters.leadType;

  if (noFilterSelected) {
    logWarn("Search attempted without filters");
    alert("Please select at least one filter");
    setRows([]);
    return;
  }

  try {
    logInfo("Calling API: POST /api/lead/list/search", filters);
    const res = await fetch(
  "https://mobile.coastal.bank.in:5001/api/lead/list/search",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId
    },
    body: JSON.stringify(filters),
  }
);

    const data = await res.json();
    logSuccess("Search results received", data);

    setRows(Array.isArray(data) ? data : []);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAllCurrentPage(false);
    setSelectAllAllPages(false);

  } catch (err) {
    console.error(err);
    logError("Search API failed", err);
    setRows([]);
  }
};

const handleAssign = async () => {

  if (!assignUser) {
    logWarn("Assign attempted without selecting user");
    alert("Please select user to assign");
    return;
  }

  if (selectedRows.length === 0) {
    logWarn("Assign attempted without selecting leads");
    alert("Please select at least one lead");
    return;
  }

  // 🚫 Check if any selected lead is completed
  const completedLeads = rows.filter(
    r =>
      selectedRows.includes(r.mobileNumber) &&
      (r.status === "OPEN" || r.status === "NOT INTERESTED")
  );

  if (completedLeads.length > 0) {
    logWarn("Assign attempted on completed leads", completedLeads);
    alert("Completed Accounts cannot be assigned.");
    return;
  }

  try {
    logInfo("Calling API: POST /api/lead/assign", {
  mobileNumbers: selectedRows,
  assignedUserId: assignUser
});

    const res = await fetch(
      "https://mobile.coastal.bank.in:5001/api/lead/assign",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify({
          mobileNumbers: selectedRows,
          assignedUserId: assignUser
        })
      }
    );

    const data = await res.json();
    logSuccess("Assign API success", data);

    alert(data.message);

    setSelectedRows([]);
    setSelectAllCurrentPage(false);
    setSelectAllAllPages(false);

  } catch (err) {
    console.error(err);
    logError("Assign API failed", err);
  }
};

const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

  return (
    <main className="flex-1 p-6 bg-slate-100">
      <div className="bg-white rounded-xl shadow p-6">
        {/* Filters */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Input
  label="Member Name"
  value={filters.memberName}
  onChange={v => setFilters(f => ({ ...f, memberName: v }))}
/>

<Input
  label="Mobile Number"
  value={filters.mobileNumber}
  onChange={v => setFilters(f => ({ ...f, mobileNumber: v }))}
/>

<Input
  label="Pincode"
  value={filters.pincode}
  onChange={v => setFilters(f => ({ ...f, pincode: v }))}
/>
          <Select
  label="Cluster"
  value={filters.cluster}
  onChange={v => {
    if (isBranchManager) return;
    setFilters(f => ({ ...f, cluster: v }));
  }}
  options={[
    { value: "Corporate Office", label: "Corporate Office" },
    ...clusters.map(c => ({
      value: c.cluster_name,
      label: c.cluster_name,
    })),
  ]}
  disabled={isBranchManager || isRegionalManager}
/>

          <Select
  label="Branch"
  value={filters.branch}
  onChange={v => {
    if (isBranchManager) return;
    setFilters(f => ({ ...f, branch: v }));
  }}
  options={branches.map(b => ({
    value: b.branch_name,
    label: b.branch_name,
  }))}
  disabled={isBranchManager}
/>

          <Select
  label="Product"
  value={filters.product}
  onChange={v => setFilters(f => ({ ...f, product: v }))}
  options={products.map(p => ({
    value: p.product,
    label: p.product,
  }))}
/>
          <Select
  label="Lead Type"
  value={filters.leadType}
  onChange={v => setFilters(f => ({ ...f, leadType: v }))}
  options={[
    { value: "Hot Lead", label: "Hot Lead" },
    { value: "Warm Lead", label: "Warm Lead" },
    { value: "Cold Lead", label: "Cold Lead" },
  ]}
/>

          <Select
  label="Assigned To"
  value={filters.assignedTo}
  onChange={v => setFilters(f => ({ ...f, assignedTo: v }))}
  options={users.map(u => ({
    value: u.userId,
    label: u.name,
  }))}
/>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mb-6">
          <button
  onClick={handleReset}
  className="px-4 py-2 bg-slate-200 rounded"
>
  Reset
</button>

          <button onClick={handleSearch} className="px-4 py-2 bg-primary text-white rounded">
  Search
</button>

          <span className="text-sm text-slate-500">
            No of Records fetched : {rows.length}
          </span>

          <label className="flex items-center gap-2 text-sm text-slate-600 ml-4">
            <input
  type="checkbox"
  checked={selectAllAllPages}
  onChange={(e) => {
    const checked = e.target.checked;
    setSelectAllAllPages(checked);

    if (checked) {
      const allIDs = rows.map(r => r.mobileNumber);
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
        </div>

        {/* Table */}
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
              setSelectAllCurrentPage(checked);

              const pageIDs = currentRows.map(
                r => r.mobileNumber
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
          First Name
        </th>
        <th className="p-3 border border-slate-300 text-left">
          Mobile Number
        </th>
        <th className="p-3 border border-slate-300 text-left">
          Branch
        </th>
        <th className="p-3 border border-slate-300 text-left">
          Lead Type
        </th>
        <th className="p-3 border border-slate-300 text-left">
          Lead Status
        </th>
        <th className="p-3 border border-slate-300 text-center">
  Action
</th>
      </tr>
    </thead>

    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan="7" className="p-6 text-center text-slate-400">
            No records found
          </td>
        </tr>
      ) : (
        currentRows.map((r, index) => {
          const serialNumber =
            (currentPage - 1) * ROWS_PER_PAGE + index + 1;

          return (
            <tr key={index}>
              <td className="p-3 border border-slate-300 text-center">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(r.mobileNumber)}
                  onChange={(e) => {
                    const id = r.mobileNumber;

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
                {r.firstName}
              </td>

              <td className="p-3 border border-slate-300">
                {r.mobileNumber}
              </td>

              <td className="p-3 border border-slate-300">
                {r.branch}
              </td>

              <td className="p-3 border border-slate-300">
                {r.leadType}
              </td>

              <td className="p-3 border border-slate-300">
  <span
className={`font-semibold ${
  r.status === "OPEN"
    ? "text-green-600"
    : r.status === "WORKING"
    ? "text-blue-600"
    : r.status === "NOT INTERESTED"
    ? "text-gray-600"
    : "text-red-600"
}`}
>
  {r.status}
</span>
</td>
<td className="p-3 border border-slate-300 text-center">
  <button
    onClick={async () => {

  try {
logInfo("Calling API: GET /api/lead/details", r.SNo);
    const res = await fetch(
      `https://mobile.coastal.bank.in:5001/api/lead/details/${r.SNo}`
    );

    const data = await res.json();
    logSuccess("Lead details fetched", data);

    setSelectedLead(data);

  } catch (err) {
    console.error(err);
    logError("Lead details API failed", err);
  }

}}
    className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
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

    <span>
      Page {currentPage} of {totalPages}
    </span>

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
)}
        {/* Assign */}
        <div className="flex items-center gap-4 mt-6">

  <Select
    label="Assign To"
    value={assignUser}
    onChange={setAssignUser}
    options={users.map(u => ({
      value: u.userId,
      label: u.name,
    }))}
  />

  <button
  onClick={handleAssign}
  className="px-6 py-2 bg-primary text-white rounded"
>
  Assign
</button>

</div>
      </div>

{selectedLead && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">

    <div className="bg-white rounded-lg shadow-xl w-[900px] p-6">

      <h2 className="text-lg font-semibold mb-6">
        Transaction Data Detail
      </h2>

      <div className="grid grid-cols-2 gap-6">

        <Input
  label="Customer Name"
  value={selectedLead?.FullName || ""}
  readOnly
/>
<Input label="Product" value={selectedLead?.SelectProduct || ""} readOnly />
        <Input label="Date of Birth" value={formatDate(selectedLead?.DOB)} readOnly />
<Input label="Gender" value="" readOnly />
<Input label="Pan Card Number" value="" readOnly />
<Input label="Address" value={selectedLead?.Address || ""} readOnly />
<Input label="Pincode" value={selectedLead?.PinCode || ""} readOnly />
<Input label="Mobile Number" value={selectedLead?.MobileNumber || ""} readOnly />
<Input label="Account #" value="" readOnly />

      </div>

      <div className="flex justify-end gap-3 mt-6">

        <button
          onClick={() => setSelectedLead(null)}
          className="px-4 py-2 bg-slate-200 rounded"
        >
          Close
        </button>

      </div>

    </div>

  </div>
)}

    </main>
  );
};

/* Reusable Components */
const Input = ({ label, value, onChange, readOnly = false }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>

    <input
      value={value}
      readOnly={readOnly}
      onChange={(e) => !readOnly && onChange(e.target.value)}
      className={`w-full mt-1 px-3 py-2 border rounded ${
        readOnly
          ? "bg-slate-200 cursor-not-allowed"
          : "bg-slate-100"
      }`}
    />

  </div>
);

const Select = ({ label, value, onChange, options = [], disabled = false }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>

    <select
      value={value}
      onChange={e => onChange(e.target.value)}
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


export default LeadList;
