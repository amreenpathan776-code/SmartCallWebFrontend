import { useEffect, useState } from "react";

const LeadDataReport = () => {

  const ALL_COLUMNS = [
  "serialNumber",
  "BranchName",
  "UserName",
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

const [showExportModal, setShowExportModal] = useState(false);
const [exportFileName, setExportFileName] = useState("Lead_Data_Report");

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRows = rows.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(rows.length / recordsPerPage);

  const [selectedColumns, setSelectedColumns] = useState(ALL_COLUMNS);


useEffect(() => {
  fetch("http://40.80.79.26:5001/api/clusters")
    .then(res => res.json())
    .then(setClusters);
}, []);


useEffect(() => {
  if (!cluster) {
    setBranches([]);
    setBranch("");
    return;
  }

  fetch(`http://40.80.79.26:5001/api/branches/${cluster}`)
    .then(res => res.json())
    .then(data => {
      setBranches(data);
      setBranch("");
    });
}, [cluster]);



useEffect(() => {

  const loadUsers = async () => {

    let selectedCluster = cluster;

    // 🔥 Treat Corporate Office as ALL
    if (cluster === "Corporate Office") {
      selectedCluster = "";
    }

    // 1️⃣ Branch selected (most specific)
    if (branch) {
      const res = await fetch("http://40.80.79.26:5001/api/assignUsers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cluster: selectedCluster,
          branchName: branch
        })
      });

      const data = await res.json();
      setUsers(data);
      setUser("");
      return;
    }

    // 2️⃣ Cluster selected
    if (selectedCluster) {
      const res = await fetch("http://40.80.79.26:5001/api/assignUsers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cluster: selectedCluster
        })
      });

      const data = await res.json();
      setUsers(data);
      setUser("");
      return;
    }

    // 3️⃣ Nothing selected → ALL users
    const res = await fetch("http://40.80.79.26:5001/api/assignUsers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    const data = await res.json();
    setUsers(data);
    setUser("");
  };

  loadUsers();

}, [cluster, branch]);


const handleSearch = async () => {

  const hasAnyFilter =
    user ||
    cluster ||
    branch ||
    fromDate ||
    toDate;

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching.");
    return; // 🚫 STOP SEARCH
  }

  const res = await fetch("http://40.80.79.26:5001/api/lead-data-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
};


const handleReset = () => {
  setCluster("");
  setBranch("");
  setUser("");
  setFromDate("");
  setToDate("");
  setRows([]);
  setBranches([]);
  setCurrentPage(1);
  setSelectedRows([]);
setSelectAllPage(false);
setSelectAllAllPages(false);
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

  if (selectedRows.length === 0) {
    alert("No records selected");
    return;
  }

  if (selectedColumns.length === 0) {
    alert("Select at least one column");
    return;
  }

  const response = await fetch(
    "http://40.80.79.26:5001/api/lead-data-report/export-pdf",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedIndexes: selectedRows,
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

  setShowExportModal(false);
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
  onChange={e => setUser(e.target.value)}
>
  <option value="">Select</option>
  {users.map(u => (
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
  onChange={e => setFromDate(e.target.value)}
  className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
/>

          </div>

          <div>
            <label className="text-sm text-slate-600">To Date</label>
            <input
  type="date"
  value={toDate}
  onChange={e => setToDate(e.target.value)}
  className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
/>
          </div>

          <div>
            <label className="text-sm text-slate-600">Cluster</label>
            <select
  className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
  value={cluster}
  onChange={e => setCluster(e.target.value)}
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
  className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
  value={branch}
  onChange={e => setBranch(e.target.value)}
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
  disabled={selectedRows.length === 0}
  onClick={() => {
    if (selectedRows.length === 0) {
      alert("Please select at least one record");
      return;
    }
    setShowExportModal(true);
  }}
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
    <th className="p-3 border">User Name</th>
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
          <td className="p-3 border">{r.UserName}</td>
          <td className="p-3 border">{r.MemberName}</td>
          <td className="p-3 border">{r.MemberAddress}</td>
          <td className="p-3 border">{r.MemberMobileNumber}</td>
          <td className="p-3 border">{r.ProductCategory}</td>
          <td className="p-3 border">{r.InitialProduct}</td>
          <td className="p-3 border">{r.InterestedProduct}</td>
          <td className="p-3 border">{r.DateOfEntry}</td>
          <td className="p-3 border">{r.DateOfVisit}</td>
          <td className="p-3 border">{r.ActivityStatus}</td>

        </tr>
      );
    })
  )}
</tbody>
</table>


 {/* PAGINATION */}
{rows.length > 0 && (
  <div className="flex justify-between items-center px-6 py-3 border-t bg-slate-50">

    <span className="text-sm text-slate-600">
      Showing {indexOfFirstRecord + 1} –
      {Math.min(indexOfLastRecord, rows.length)} of {rows.length}
    </span>

    <div className="flex gap-2">

      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        ⏮
      </button>

      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => p - 1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        ◀
      </button>

      <span className="px-3 py-1 text-sm">
        Page {currentPage} of {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(p => p + 1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        ▶
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(totalPages)}
        className="px-3 py-1 border rounded disabled:opacity-40"
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

        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Download PDF
        </button>
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
