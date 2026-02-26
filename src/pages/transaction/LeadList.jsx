import { useEffect, useState } from "react";

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


useEffect(() => {
  fetch("http://40.80.79.26:5001/api/clusters")
    .then(res => res.json())
    .then(setClusters);

  fetch("http://40.80.79.26:5001/api/products")
    .then(res => res.json())
    .then(setProducts);
}, []);

useEffect(() => {
  // ✅ If NO cluster selected → load ALL branches
  if (!filters.cluster) {
    fetch("http://40.80.79.26:5001/api/branches")
      .then(res => res.json())
      .then(setBranches);

    return;
  }

  // ✅ If cluster selected (including Corporate Office)
  fetch(`http://40.80.79.26:5001/api/branches/${filters.cluster}`)
    .then(res => res.json())
    .then(setBranches);

  // reset dependent fields
  setFilters(f => ({ ...f, branch: "", assignedTo: "" }));
}, [filters.cluster]);


useEffect(() => {
  // ✅ If NO branch selected → load ALL users
  if (!filters.branch) {
    fetch("http://40.80.79.26:5001/api/assignUsers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cluster: filters.cluster || "",
        branchName: "",
      }),
    })
      .then(res => res.json())
      .then(setUsers);

    return;
  }

  // ✅ If branch selected → filtered users
  fetch("http://40.80.79.26:5001/api/assignUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cluster: filters.cluster,
      branchName: filters.branch,
    }),
  })
    .then(res => res.json())
    .then(setUsers);
}, [filters.branch, filters.cluster]);

// ✅ Pagination Logic
const indexOfLastRecord = currentPage * ROWS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - ROWS_PER_PAGE;

const safeRows = Array.isArray(rows) ? rows : [];
const currentRows = safeRows.slice(indexOfFirstRecord, indexOfLastRecord);

const totalPages = Math.max(
  1,
  Math.ceil(rows.length / ROWS_PER_PAGE)
);


useEffect(() => {
  const pageIDs = currentRows.map(r => r.mobileNumber);

  const allSelected =
    pageIDs.length > 0 &&
    pageIDs.every(id => selectedRows.includes(id));

  setSelectAllCurrentPage(allSelected);
}, [currentRows, selectedRows]);


const handleReset = () => {
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

  setRows([]);
  setBranches([]);
  setUsers([]);
  setCurrentPage(1);
setSelectedRows([]);
setSelectAllCurrentPage(false);
setSelectAllAllPages(false);

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
    alert("Please select at least one filter");
    setRows([]);
    return;
  }

  try {
    const res = await fetch(
      "http://40.80.79.26:5001/api/lead/list/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      }
    );

    const data = await res.json();

    setRows(Array.isArray(data) ? data : []);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAllCurrentPage(false);
    setSelectAllAllPages(false);

  } catch (err) {
    console.error(err);
    setRows([]);
  }
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
  onChange={v => setFilters(f => ({ ...f, cluster: v }))}
  options={[
    { value: "Corporate Office", label: "Corporate Office" },
    ...clusters.map(c => ({
      value: c.cluster_name,
      label: c.cluster_name,
    })),
  ]}
/>

          <Select
  label="Branch"
  value={filters.branch}
  onChange={v => setFilters(f => ({ ...f, branch: v }))}
  options={branches.map(b => ({
    value: b.branch_name,
    label: b.branch_name,
  }))}
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
                {r.status}
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

    <div>
      Page {currentPage} of {totalPages}
    </div>

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
          <Select label="Assign To" />
          <button className="px-6 py-2 bg-primary text-white rounded">
            Assign
          </button>
        </div>
      </div>
    </main>
  );
};

/* Reusable Components */
const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
    />
  </div>
);


const Select = ({ label, value, onChange, options = [] }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
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
