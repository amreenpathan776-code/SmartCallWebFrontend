import { useEffect, useState } from "react";

const RECORDS_PER_PAGE = 15;

const FieldVisitReport = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const EXPORT_COLUMNS = [
  { key: "UserName", label: "User Name" },
  { key: "AccountNo", label: "Account Number" },
  { key: "CustomerName", label: "Customer Name" },
  { key: "BranchLatitude", label: "Branch Lat" },
  { key: "BranchLongitude", label: "Branch Lon" },
  { key: "MeetingDate", label: "Meeting Date" },
  { key: "StartLatitude", label: "Start Lat" },
  { key: "StartLongitude", label: "Start Lon" },
  { key: "MeetingLatitude", label: "Meeting Lat" },
  { key: "MeetingLongitude", label: "Meeting Lon" },
  { key: "MeetingAddress", label: "Meeting Address" },
  { key: "DistanceTravelled", label: "Distance Travelled" },
  { key: "CustomerLatitude", label: "Customer Lat" },
  { key: "CustomerLongitude", label: "Customer Lon" },
  { key: "Variance", label: "Variance" },
  { key: "Flow", label: "Flow" }
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
  const [initialUsers, setInitialUsers] = useState([]);

  const [selectedRows, setSelectedRows] = useState([]);
const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);
  
  const [showExport, setShowExport] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(
    
  EXPORT_COLUMNS.map(c => c.key) // all selected by default
);


  // ================= LOAD CLUSTERS =================
  useEffect(() => {
  fetch("http://40.80.79.26:5001/api/clusters")
    .then(res => res.json())
    .then(data => {
      setClusters([
        { cluster_name: "Corporate Office" },
        ...data
      ]);
    });
}, []);

  // ================= LOAD USERS INITIALLY =================
  useEffect(() => {
  fetch("http://40.80.79.26:5001/api/assignUsers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  })
    .then(res => res.json())
    .then(data => {
      setUsers(data);
      setInitialUsers(data); // SAVE DEFAULT USERS
    });
}, []);

  // ================= CLUSTER CHANGE =================
  useEffect(() => {
    if (!cluster) {
      setBranches([]);
      setBranch("");
      return;
    }

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
  }, [cluster]);

  // ================= BRANCH CHANGE =================
  useEffect(() => {
    if (!branch) return;

    fetch("http://40.80.79.26:5001/api/assignUsers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cluster, branchName: branch })
    })
      .then(res => res.json())
      .then(setUsers);
  }, [branch, cluster]);

  // ================= SEARCH =================
  const [tableData, setTableData] = useState([]);

const handleSearch = () => {
  const hasAnyFilter = [
    user,
    fromDate,
    toDate,
    cluster,
    branch
  ].some(v => v && v.trim() !== "");

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching");
    return;
  }

  fetch("http://40.80.79.26:5001/api/field-visit-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
  user,
  cluster,
  branch,
  fromDate,
  toDate
})
  })
    .then(res => res.json())
    .then(data => {
      setTableData(Array.isArray(data) ? data : []);
      setCurrentPage(1);
      setSelectedRows([]);
      setSelectAllPage(false);
      setSelectAllAllPages(false);
    })
    .catch(() => setTableData([]));
};

const exportPDF = () => {

  if (selectedRows.length === 0) {
    alert("Please select at least one record to export");
    return;
  }

  // Keep order exactly like frontend
  const selectedData = selectedRows
    .sort((a, b) => a - b)
    .map(index => ({
      SNo: index + 1,   // ✅ FRONTEND S.No
      ...tableData[index]
    }));

  fetch("http://40.80.79.26:5001/api/field-visit-report/export-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      columns: selectedColumns,
      data: selectedData
    })
  })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Field_Visit_Report.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
      setShowExport(false);
    });
};

  // ================= RESET =================
  const handleReset = () => {
  setCluster("");
  setBranch("");
  setUser("");
  setFromDate("");
  setToDate("");

  setBranches([]);          // clear branch dropdown
  setUsers(initialUsers);   // restore all users
  setTableData([]);         // CLEAR TABLE
  setCurrentPage(1); // inside handleReset
  setSelectedRows([]);
  setSelectAllPage(false);
  setSelectAllAllPages(false);

  console.log("FIELD VISIT RESET COMPLETED");
};

const totalPages = Math.max(
  1,
  Math.ceil(tableData.length / RECORDS_PER_PAGE)
);

const paginatedData = tableData.slice(
  (currentPage - 1) * RECORDS_PER_PAGE,
  currentPage * RECORDS_PER_PAGE
);

useEffect(() => {
  const pageIDs = paginatedData.map(
    (_, i) => (currentPage - 1) * RECORDS_PER_PAGE + i
  );

  const allSelected =
    pageIDs.length > 0 &&
    pageIDs.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);
}, [paginatedData, selectedRows, currentPage]);

  return (
    <div className="p-6 w-full">

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl p-6 shrink-0">
        <div className="grid grid-cols-5 gap-6">

          {/* User */}
          <div>
            <label className="text-sm text-slate-600">User</label>
            <select
              value={user}
              onChange={e => setUser(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {users.map(u => (
                <option key={u.userId} value={u.userId}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="text-sm text-slate-600">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-sm text-slate-600">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* Cluster */}
          <div>
            <label className="text-sm text-slate-600">Cluster</label>
            <select
              value={cluster}
              onChange={e => setCluster(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {clusters.map(c => (
                <option key={c.cluster_name} value={c.cluster_name}>
                  {c.cluster_name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="text-sm text-slate-600">Branch</label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {branches.map(b => (
                <option key={b.branch_name} value={b.branch_name}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Buttons */}
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
    className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-40"
    onClick={() => setShowExport(true)}
    disabled={tableData.length === 0}
  >
    Export Data
  </button>
</div>
        </div>

      {/* ================= SELECT ALL PAGINATION ================= */}

{tableData.length > 0 && (
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
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
)}

      {/* ================= TABLE ================= */}
<div className="bg-white rounded-xl border mt-6">

  {/* SCROLL ONLY TABLE */}
  <div className="overflow-x-auto">

    <table className="min-w-[1800px] w-full text-sm border border-slate-300 border-collapse">

      {/* ================= TABLE HEADER ================= */}
      <thead>

  {/* GROUP HEADER ROW */}
  <tr className="text-center text-sm uppercase tracking-wide">

  <th colSpan={2} className="border bg-white"></th>

  <th
    colSpan={6}
    className="border bg-white-50 text-blue-700 font-bold py-3"
  >
    Branch Location
  </th>

  <th
    colSpan={6}
    className="border bg-white-50 text-green-700 font-bold py-3"
  >
    Customer Location
  </th>

  <th
    colSpan={4}
    className="border bg-white-50 text-purple-700 font-bold py-3"
  >
    Meeting Location
  </th>

</tr>

  {/* COLUMN HEADER ROW */}
  <tr className="bg-slate-100 text-left">

    {/* Checkbox header */}
    <th className="px-4 py-3 border text-center">
      <input
        type="checkbox"
        checked={selectAllPage}
        onChange={(e) => {
          const checked = e.target.checked;

          const pageIDs = paginatedData.map(
            (_, i) => (currentPage - 1) * RECORDS_PER_PAGE + i
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

    {/* S. No */}
    <th className="px-4 py-3 border font-semibold">
      S. No.
    </th>

    {/* Branch */}
    <th className="px-4 py-3 border">User Name</th>
    <th className="px-4 py-3 border">Account No</th>
    <th className="px-4 py-3 border">Customer Name</th>
    <th className="px-4 py-3 border">Branch Latitude</th>
    <th className="px-4 py-3 border">Branch Longitude</th>
    <th className="px-4 py-3 border">Meeting Date</th>

    {/* Customer */}
    <th className="px-4 py-3 border">Start Latitude</th>
    <th className="px-4 py-3 border">Start Longitude</th>
    <th className="px-4 py-3 border">Meeting Latitude</th>
    <th className="px-4 py-3 border">Meeting Longitude</th>
    <th className="px-4 py-3 border">Meeting Address</th>
    <th className="px-4 py-3 border">Distance Travelled</th>

    {/* Meeting */}
    <th className="px-4 py-3 border">Customer Latitude</th>
    <th className="px-4 py-3 border">Customer Longitude</th>
    <th className="px-4 py-3 border">Variance</th>
    <th className="px-4 py-3 border">Flow</th>

  </tr>

</thead>

      {/* ================= TABLE BODY ================= */}
      <tbody>
  {tableData.length === 0 ? (
    <tr>
      <td colSpan={18} className="text-center py-16 text-slate-400 border">
        No records found
      </td>
    </tr>
  ) : (
    paginatedData.map((row, i) => {
  const rowIndex =
    (currentPage - 1) * RECORDS_PER_PAGE + i;

  return (
    <tr
  key={rowIndex}
  className={`border-b hover:bg-slate-50 ${
    rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"
  }`}
>
      {/* Row Checkbox */}
      <td className="border px-4 text-center">
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

      {/* S.No */}
      <td className="border px-4">
        {rowIndex + 1}
      </td>

      <td className="border px-4">{row.UserName}</td>
      <td className="border px-4">{row.AccountNo}</td>
      <td className="border px-4">{row.CustomerName}</td>
      <td className="border px-4">{row.BranchLatitude}</td>
      <td className="border px-4">{row.BranchLongitude}</td>
      <td className="border px-4">
        {row.MeetingDate?.split("T")[0]}
      </td>
      <td className="border px-4">{row.StartLatitude}</td>
      <td className="border px-4">{row.StartLongitude}</td>
      <td className="border px-4">{row.MeetingLatitude}</td>
      <td className="border px-4">{row.MeetingLongitude}</td>
      <td className="border px-4">{row.MeetingAddress}</td>
      <td className="border px-4">{row.DistanceTravelled}</td>
      <td className="border px-4">{row.CustomerLatitude}</td>
      <td className="border px-4">{row.CustomerLongitude}</td>
      <td className="border px-4">{row.Variance}</td>
      <td className="border px-4">{row.Flow}</td>

    </tr>
  );
})
  )}
</tbody>
    </table>

    {/* Pagination */}

    {tableData.length > 0 && (
  <div className="flex justify-between items-center px-6 py-3 border-t bg-slate-50">
    
    <span className="text-sm text-slate-600">
      Page {currentPage} of {totalPages}
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
  </div>

</div>
{showExport && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[600px] rounded-xl shadow-lg p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Export Grid</h2>
        <button onClick={() => setShowExport(false)}>✖</button>
      </div>

      {/* FILENAME */}
      <div className="mb-4">
        <label className="text-sm text-slate-600">Filename</label>
        <input
          value={`Field_Visit_Report_${new Date().toISOString().slice(0,10)}`}
          disabled
          className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
        />
      </div>

      {/* COLUMN LIST */}
      <div className="max-h-[300px] overflow-y-auto border rounded">
        {EXPORT_COLUMNS.map(col => (
          <label
            key={col.key}
            className="flex items-center gap-3 px-4 py-2 border-b cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedColumns.includes(col.key)}
              onChange={() => {
                setSelectedColumns(prev =>
                  prev.includes(col.key)
                    ? prev.filter(k => k !== col.key)
                    : [...prev, col.key]
                );
              }}
            />
            {col.label}
          </label>
        ))}
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          className="px-4 py-2 bg-slate-200 rounded"
          onClick={() => setShowExport(false)}
        >
          Cancel
        </button>

        <button
          className="px-4 py-2 bg-primary text-white rounded"
          onClick={() => exportPDF()}
        >
          Export PDF
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
};

export default FieldVisitReport;
