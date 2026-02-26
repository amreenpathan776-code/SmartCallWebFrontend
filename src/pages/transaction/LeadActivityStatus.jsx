import { useEffect, useState } from "react";


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
  const [setLeadType, setSetLeadType] = useState("");
  const [setLeadStatus, setSetLeadStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
const ROWS_PER_PAGE = 15;

const [selectedRows, setSelectedRows] = useState([]);
const [selectAllCurrentPage, setSelectAllCurrentPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);


useEffect(() => {
  fetch("http://40.80.79.26:5001/api/clusters")
    .then(res => res.json())
    .then(data => {
      const clusterList = data.map(d => d.cluster_name);
      setClusters(["Corporate Office", ...clusterList]);
    });
}, []);


useEffect(() => {
  fetch("http://40.80.79.26:5001/api/products")
    .then(res => res.json())
    .then(data => setProducts(data.map(d => d.product)));
}, []);


useEffect(() => {
  if (!filters.cluster) return;

  fetch(`http://40.80.79.26:5001/api/branches/${filters.cluster}`)
    .then(res => res.json())
    .then(data => setBranches(data.map(b => b.branch_name)));
}, [filters.cluster]);


useEffect(() => {
  fetch("http://40.80.79.26:5001/api/assignUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cluster: filters.cluster,
      branchName: filters.branchName
    })
  })
    .then(res => res.json())
    .then(data => setUsers(data.map(u => u.name)));
}, [filters.cluster, filters.branchName]);

const handleSearch = async () => {

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

  if (noFilterSelected) {
    alert("Please select at least one filter");
    setRows([]);
    return;
  }

  const res = await fetch("http://40.80.79.26:5001/api/leads-data/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters)
  });

  const data = await res.json();
  setRows(Array.isArray(data) ? data : []);
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

useEffect(() => {
  const pageIDs = currentRows.map(r => r.loanAccountNumber);

  const allSelected =
    pageIDs.length > 0 &&
    pageIDs.every(id => selectedRows.includes(id));

  setSelectAllCurrentPage(allSelected);
}, [currentRows, selectedRows]);


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
  onChange={(e) =>
    setFilters({ ...filters, cluster: e.target.value, branchName: "" })
  }
/>

          <Select
  label="Branch Name"
  options={branches}
  value={filters.branchName}
  onChange={(e) =>
    setFilters({ ...filters, branchName: e.target.value })
  }
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
  options={users}
  value={filters.assignedTo}
  onChange={(e) =>
    setFilters({ ...filters, assignedTo: e.target.value })
  }
/>

          <Select
  label="Closed By"
  options={users}
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
    setRows([]);
  }}
>
  Reset
</button>

          <button
  className="px-4 py-2 bg-primary text-white rounded"
  onClick={handleSearch}
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

          <button className="ml-auto px-4 py-2 bg-slate-100 rounded">
            Past Schedule ℹ️
          </button>

          <button className="px-4 py-2 bg-slate-100 rounded">
            Future Schedule ℹ️
          </button>

          <button
            disabled
            className="px-4 py-2 bg-slate-200 text-slate-400 rounded cursor-not-allowed"
          >
            Re Activate
          </button>
        </div>

        {/* ================= SET STATUS SECTION ================= */}
<div className="grid grid-cols-4 gap-6 mb-6 items-end">
  
  <Select
    label="Set Lead Type"
    options={leadTypes}
    value={setLeadType}
    onChange={(e) => setSetLeadType(e.target.value)}
  />

  <Select
    label="Set Lead Status"
    options={leadStatuses}
    value={setLeadStatus}
    onChange={(e) => setSetLeadStatus(e.target.value)}
  />

  <button
    className="h-[42px] mt-6 bg-primary text-white rounded flex items-center justify-center gap-2"
    onClick={() => {
      console.log("Set Lead Type:", setLeadType);
      console.log("Set Lead Status:", setLeadStatus);
      // Backend will be added later
    }}
  >
    🔍 Search
  </button>

  <button
    className="h-[42px] mt-6 bg-slate-100 rounded flex items-center justify-center gap-2"
    onClick={() => {
      setSetLeadType("");
      setSetLeadStatus("");
    }}
  >
    🔄 Refresh
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
                {row.loanAccountNumber}
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

const Select = ({ label, options = [], value, onChange }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <select
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
      value={value}
      onChange={onChange}
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default LeadActivityStatus;
