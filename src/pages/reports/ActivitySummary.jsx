import { useEffect, useState } from "react";

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
const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

  const totalPages = Math.max(
  1,
  Math.ceil(tableData.length / RECORDS_PER_PAGE)
);

  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;

  const paginatedData = tableData.slice(startIndex, endIndex);
  
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
  fetch("http://40.80.79.26:5001/api/clusters")
    .then(res => res.json())
    .then(data => {
      setClusters([
        { cluster_name: "Corporate Office" },
        ...data
      ]);
    })
    .catch(err => console.error("Cluster fetch error:", err));
}, []);

  useEffect(() => {
  if (!cluster) {
    setBranches([]);
    setUsers([]);
    setBranch("");
    setUser("");
    return;
  }

  // ✅ If Corporate Office → load ALL users
  if (cluster === "Corporate Office") {
    fetch("http://40.80.79.26:5001/api/assignUsers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})   // ← empty body = all users
    })
      .then(res => res.json())
      .then(setUsers);

    setBranches([]);
    setBranch("");
    setUser("");
    return;
  }

  // 🔹 Normal Cluster Flow
  fetch(`http://40.80.79.26:5001/api/branches/${encodeURIComponent(cluster)}`)
    .then(res => res.json())
    .then(setBranches);

  fetch("http://40.80.79.26:5001/api/assignUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cluster })
  })
    .then(res => res.json())
    .then(setUsers);

  setBranch("");
  setUser("");
}, [cluster]);


useEffect(() => {
  // Load ALL users initially (Corporate Office behavior)
  fetch("http://40.80.79.26:5001/api/assignUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  })
    .then(res => res.json())
    .then(setUsers);
}, []);

  // ================= BRANCH CHANGE =================
  useEffect(() => {
  if (!branch || !cluster) return;

  fetch("http://40.80.79.26:5001/api/assignUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cluster,
      branchName: branch
    })
  })
    .then(res => res.json())
    .then(setUsers);

  setUser("");
}, [branch, cluster]);


const handleSearch = async () => {
  const hasAnyFilter = [
    user,
    cluster,
    branch,
    fromDate,
    toDate
  ].some(v => v && v.trim() !== "");

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching");
    return;
  }

  const payload = {
    user,
    cluster,
    branch,
    fromDate,
    toDate
  };

  setLoading(true);
  setCurrentPage(1);

  try {
    const res = await fetch("http://40.80.79.26:5001/api/activity-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setTableData(data);
    setSelectedRows([]);
    setSelectAllPage(false);
    setSelectAllAllPages(false);

  } catch (err) {
    console.error("Search error:", err);
  } finally {
    setLoading(false);
  }
};


const handleReset = () => {
  setCluster("");
  setBranch("");
  setUser("");
  setFromDate("");
  setToDate("");

  setBranches([]);
  setUsers([]);
  setTableData([]);
  setCurrentPage(1);
  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);


  console.log("RESET CLICKED");
};

const handleBackendPDFExport = async () => {

  if (selectedRows.length === 0) {
    alert("Please select at least one record to export");
    return;
  }

  // Prepare selected rows data with S.No from frontend
  const selectedData = selectedRows
    .sort((a, b) => a - b) // ✅ keep order
    .map(index => ({
      SNo: index + 1,       // ✅ Frontend S.No
      ...tableData[index]
    }));

  const payload = {
    selectedData,          // ✅ send selected rows only
    columns: selectedCols,
    fileName
  };

  try {
    const res = await fetch(
      "http://40.80.79.26:5001/api/activity-summary/export-pdf",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

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
    setShowExport(false);

  } catch (err) {
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
          onChange={e => setUser(e.target.value)}
          options={users.map(u => ({
            value: u.name,
            label: u.name
          }))}
        />

        <DateInput
  label="From Date"
  value={fromDate}
  onChange={e => setFromDate(e.target.value)}
/>

<DateInput
  label="To Date"
  value={toDate}
  onChange={e => setToDate(e.target.value)}
/>

        <Select
          label="Cluster"
          value={cluster}
          onChange={e => setCluster(e.target.value)}
          options={clusters.map(c => ({
            value: c.cluster_name,
            label: c.cluster_name
          }))}
        />

        <Select
          label="Branch"
          value={branch}
          onChange={e => setBranch(e.target.value)}
          disabled={!cluster}
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
    onClick={() => setShowExport(true)}
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
  <div className="flex justify-center items-center gap-3 mt-4">

    <button
      className="px-3 py-1 border rounded disabled:opacity-50"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(1)}
    >
      ⏮
    </button>

    <button
      className="px-3 py-1 border rounded disabled:opacity-50"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => p - 1)}
    >
      ◀
    </button>

    <span className="text-sm font-medium">
      Page {currentPage} of {totalPages}
    </span>

    <button
      className="px-3 py-1 border rounded disabled:opacity-50"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(p => p + 1)}
    >
      ▶
    </button>

    <button
      className="px-3 py-1 border rounded disabled:opacity-50"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(totalPages)}
    >
      ⏭
    </button>

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
        onChange={e => setFileName(e.target.value)}
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
          onClick={() => setShowExport(false)}
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
const Select = ({ label, value, onChange, options, disabled }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100 disabled:opacity-50"
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
