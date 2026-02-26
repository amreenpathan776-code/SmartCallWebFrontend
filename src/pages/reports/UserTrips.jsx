import { useEffect, useState } from "react";

const UserTrips = () => {

  // ================= STATE =================
  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);

  const [cluster, setCluster] = useState("");
  const [branch, setBranch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);
const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

const [showExportModal, setShowExportModal] = useState(false);
const [exportFileName, setExportFileName] = useState("User_Trips_Report");

const [selectedColumns, setSelectedColumns] = useState([
  "serialNumber",
  "UserName",
  "UserId",
  "MemberName",
  "AccountNumber",
  "BranchName",
  "MonthYear",
  "VisitDate",
  "TotalDistance",
  "DistanceTravelled",
  "StartLocation",
  "EndLocation"
]);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;


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

  // ================= CLUSTER CHANGE =================
  useEffect(() => {

  const loadBranchData = async () => {

    if (!cluster) {
      setBranches([]);
      setBranch("");
      return;
    }

    try {
      const res = await fetch(
        `http://40.80.79.26:5001/api/branches/${encodeURIComponent(cluster)}`
      );

      const data = await res.json();
      setBranches(data || []);

    } catch (err) {
      console.error("Branch load error:", err);
    }

    setBranch("");
  };

  loadBranchData();

}, [cluster]);

  // ================= SEARCH =================
  const handleSearch = async () => {

  const hasAnyFilter =
    cluster ||
    branch ||
    fromDate ||
    toDate;

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching.");
    return; // 🚫 STOP SEARCH
  }

  setLoading(true);

  try {
    const res = await fetch("http://40.80.79.26:5001/api/user-trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cluster,
        branch,
        fromDate,
        toDate
      })
    });

    const data = await res.json();

    setTrips(data || []);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAllPage(false);
    setSelectAllAllPages(false);

  } catch (err) {
    console.error("SEARCH ERROR:", err);
  } finally {
    setLoading(false);
  }
};

  // ================= RESET =================
  const handleReset = () => {
  setCluster("");
  setBranch("");
  setFromDate("");
  setToDate("");
  setBranches([]);
  setTrips([]);
setCurrentPage(1);
setSelectedRows([]);
setSelectAllPage(false);
setSelectAllAllPages(false);
};

const indexOfLastRecord = currentPage * recordsPerPage;
const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
const currentTrips = trips.slice(indexOfFirstRecord, indexOfLastRecord);

const totalPages = Math.ceil(trips.length / recordsPerPage);

useEffect(() => {
  const pageIndexes = currentTrips.map(
    (_, i) => indexOfFirstRecord + i
  );

  const allSelected =
    pageIndexes.length > 0 &&
    pageIndexes.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);

}, [currentPage, selectedRows, currentTrips, indexOfFirstRecord]);

const handleExportPDF = async () => {

  if (selectedRows.length === 0) {
    alert("No records selected");
    return;
  }

  if (selectedColumns.length === 0) {
    alert("Please select at least one column");
    return;
  }

  try {
    const response = await fetch(
      "http://40.80.79.26:5001/api/user-trips/export-pdf",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedIndexes: selectedRows,
          columns: selectedColumns,
          fileName: exportFileName,
          fullData: trips
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

  } catch (err) {
    alert("PDF export failed");
  }
};

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl p-6 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-end">

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
  disabled={!cluster}
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

          {/* Buttons */}
          <div className="flex gap-3 md:col-span-2">
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
  onClick={() => {
    if (selectedRows.length === 0) {
      alert("Please select at least one record");
      return;
    }
    setShowExportModal(true);
  }}
  className="px-6 py-2 bg-blue-600 text-white rounded"
>
  Export Data
</button>

          </div>

        </div>
      </div>

{/* ================= SELECT ALL PAGES ================= */}
      {trips.length > 0 && (
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={(e) => {
        const checked = e.target.checked;
        setSelectAllAllPages(checked);

        if (checked) {
          const allIndexes = trips.map((_, i) => i);
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
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="min-w-[2000px] w-full text-sm border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-20">
  <tr>

    {/* Select Page Checkbox */}
    <th className="px-4 py-4 border text-center">
      <input
        type="checkbox"
        checked={selectAllPage}
        onChange={(e) => {
          const checked = e.target.checked;

          const pageIndexes = currentTrips.map(
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

    <th className="px-6 py-4 border">S. No.</th>

    {[
      "User Name",
      "User Id",
      "Member Name",
      "Account Number",
      "Branch Name",
      "Month Year",
      "Date",
      "Total Distance",
      "Distance Travelled",
      "Start Location",
      "End Location",
    ].map(col => (
      <th
        key={col}
        className="px-6 py-4 border text-left font-semibold whitespace-nowrap"
      >
        {col}
      </th>
    ))}

  </tr>
</thead>
            <tbody>
  {loading ? (
    <tr>
      <td colSpan={13} className="text-center py-16">
        Loading...
      </td>
    </tr>
  ) : trips.length === 0 ? (
    <tr>
      <td colSpan={13} className="text-center py-16 text-slate-400">
        No records found
      </td>
    </tr>
  ) : (
    currentTrips.map((row, i) => {
      const globalIndex = indexOfFirstRecord + i;

      return (
        <tr key={globalIndex} className="hover:bg-slate-50">

          {/* Row Checkbox */}
          <td className="px-4 py-3 border text-center">
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

          {/* S. No */}
          <td className="px-6 py-3 border">
            {globalIndex + 1}
          </td>

          <td className="px-6 py-3 border">{row.UserName}</td>
          <td className="px-6 py-3 border">{row.UserId}</td>
          <td className="px-6 py-3 border">{row.MemberName}</td>
          <td className="px-6 py-3 border">{row.AccountNumber}</td>
          <td className="px-6 py-3 border">{row.BranchName}</td>
          <td className="px-6 py-3 border">{row.MonthYear}</td>
          <td className="px-6 py-3 border">
            {row.VisitDate?.split("T")[0]}
          </td>
          <td className="px-6 py-3 border">{row.TotalDistance}</td>
          <td className="px-6 py-3 border">{row.DistanceTravelled}</td>
          <td className="px-6 py-3 border">{row.StartLocation}</td>
          <td className="px-6 py-3 border">{row.EndLocation}</td>

        </tr>
      );
    })
  )}
</tbody>
          </table>

{/* ================= PAGINATION ================= */}
{trips.length > 0 && (
  <div className="flex justify-between items-center px-6 py-4 border-t bg-white">

    <span className="text-sm text-slate-600">
      Showing {indexOfFirstRecord + 1} –
      {Math.min(indexOfLastRecord, trips.length)} of {trips.length}
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
        {[
          "serialNumber",
          "UserName",
          "UserId",
          "MemberName",
          "AccountNumber",
          "BranchName",
          "MonthYear",
          "VisitDate",
          "TotalDistance",
          "DistanceTravelled",
          "StartLocation",
          "EndLocation"
        ].map(col => (
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

export default UserTrips;
