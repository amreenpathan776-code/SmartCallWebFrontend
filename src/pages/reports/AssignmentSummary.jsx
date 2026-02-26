import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const AssignmentSummary = () => {

  const [filters, setFilters] = useState({
    userName: "",
    cluster: "",
    branch: "",
    fromDate: "",
    toDate: "",
  });

  const [users, setUsers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState([]);

  const RECORDS_PER_PAGE = 15;

const [currentPage, setCurrentPage] = useState(1);
const [selectedRows, setSelectedRows] = useState([]);
const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);


  // ===========================
  // INITIAL LOAD
  // ===========================

useEffect(() => {
  loadClusters();
}, []);

  // ===========================
  // LOAD CLUSTERS
  // ===========================
  const loadClusters = async () => {
    try {
      const res = await axios.get(
        "http://40.80.79.26:5001/api/clusters"
      );

      const clusterList = res.data.map((x) => x.cluster_name);
      setClusters(["Corporate Office", ...clusterList]);

    } catch (err) {
      console.error("Error loading clusters:", err);
    }
  };


  // ===========================
  // LOAD USERS
  // ===========================
  const loadUsers = useCallback(async () => {
  try {

    const res = await axios.post(
      "http://40.80.79.26:5001/api/users/list",
      {
        page: 1,
        pageSize: 1000,
        cluster:
          filters.cluster === "Corporate Office"
            ? ""
            : filters.cluster || "",
        branch: filters.branch || "",
        name: ""
      }
    );

    setUsers(res.data.records.map(u => u.userName));

  } catch (err) {
    console.error("Error loading users:", err);
  }
}, [filters.cluster, filters.branch]);

  useEffect(() => {

  const handleClusterChange = async () => {

    // 🔹 Nothing selected
    if (!filters.cluster) {
      setBranches([]);
      setUsers([]);
      return;
    }

    try {
      // 🔥 Always call same API
      const res = await axios.get(
        `http://40.80.79.26:5001/api/branches/${filters.cluster}`
      );

      setBranches(res.data.map(x => x.branch_name));

    } catch (err) {
      console.error(err);
    }

    // 🔹 Reset branch & user
    setFilters(prev => ({
      ...prev,
      branch: "",
      userName: ""
    }));

  };

  handleClusterChange();

}, [filters.cluster]);

  // ===========================
  // WHEN CLUSTER OR BRANCH CHANGES
  // ===========================
  useEffect(() => {
  loadUsers();
}, [loadUsers]);

  // ===========================
  // SEARCH
  // ===========================
  const handleSearch = async () => {

  const hasAnyFilter = Object.values(filters)
    .some(value => value && value.toString().trim() !== "");

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching.");
    return; // 🚫 STOP
  }

  try {
    const res = await axios.post(
      "http://40.80.79.26:5001/api/assignment-summary/search",
      filters
    );

    setData(res.data || []);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAllPage(false);
    setSelectAllAllPages(false);

  } catch (err) {
    console.error("Search error:", err);
  }
};

  // ===========================
  // RESET
  // ===========================
  const handleReset = () => {
    setFilters({
      userName: "",
      cluster: "",
      branch: "",
      fromDate: "",
      toDate: "",
    });
    setData([]);
    setCurrentPage(1);
setSelectedRows([]);
setSelectAllPage(false);
setSelectAllAllPages(false);
  };

  const formatDPD = (value) => {
  if (!value) return "";
  if (value === "01") return "0-30 Days";
  if (value === "02") return "31-60 Days";
  if (value === "03") return "61-90 Days";
  if (parseInt(value) >= 4) return "Above 90 Days";
  return value;
};

const totalPages = Math.max(
  1,
  Math.ceil(data.length / RECORDS_PER_PAGE)
);

const indexOfLastRecord = currentPage * RECORDS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - RECORDS_PER_PAGE;

const currentRecords = data.slice(
  indexOfFirstRecord,
  indexOfLastRecord
);

useEffect(() => {
  const pageIndexes = currentRecords.map(
    (_, i) => indexOfFirstRecord + i
  );

  const allSelected =
    pageIndexes.length > 0 &&
    pageIndexes.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);

}, [currentPage, selectedRows, currentRecords, indexOfFirstRecord]);


const [showExportModal, setShowExportModal] = useState(false);
const [pdfFileName, setPdfFileName] = useState("Assignment_Summary_Report");

const allColumns = [
  { key: "serialNumber", label: "S. No." },
  { key: "UserId", label: "User Id" },
  { key: "UserName", label: "User Name" },
  { key: "BranchCode", label: "Branch Code" },
  { key: "BranchName", label: "Branch Name" },
  { key: "AccountNumber", label: "Account Number" },
  { key: "CustomerName", label: "Customer Name" },
  { key: "DpdQueue", label: "DPD Queue" },
  { key: "NoOfCalls", label: "No. of Calls" }
];

const [selectedColumns, setSelectedColumns] = useState(
  allColumns.map(col => col.key)
);

const handleExportPDF = async () => {

  if (selectedRows.length === 0) {
    alert("No records selected.");
    return;
  }

  const selectedData = selectedRows.map(index => {
    const row = data[index];
    return {
      ...row,
      serialNumber: index + 1
    };
  });

  try {
    const res = await axios.post(
      "http://40.80.79.26:5001/api/assignment-summary/export-pdf",
      {
        records: selectedData,
        columns: selectedColumns,
        fileName: pdfFileName
      },
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${pdfFileName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    setShowExportModal(false);

  } catch (err) {
    console.error("PDF export error:", err);
  }
};

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">

      {/* FILTERS */}
      <div className="bg-white rounded-xl p-6 shrink-0">
        <div className="grid grid-cols-5 gap-6">

          {/* USER */}
          <div>
            <label className="text-sm text-slate-600">User</label>
            <select
              value={filters.userName}
              onChange={(e) =>
                setFilters({ ...filters, userName: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {users.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* FROM DATE */}
          <div>
            <label className="text-sm text-slate-600">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters({ ...filters, fromDate: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* TO DATE */}
          <div>
            <label className="text-sm text-slate-600">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) =>
                setFilters({ ...filters, toDate: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          {/* CLUSTER */}
          <div>
            <label className="text-sm text-slate-600">Cluster</label>
            <select
              value={filters.cluster}
              onChange={(e) =>
                setFilters({ ...filters, cluster: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {clusters.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* BRANCH */}
          <div>
            <label className="text-sm text-slate-600">Branch</label>
            <select
              disabled={!filters.cluster}
              value={filters.branch}
              onChange={(e) =>
                setFilters({ ...filters, branch: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary text-white rounded"
          >
            Search
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-slate-200 rounded"
          >
            Reset
          </button>
          <button
  disabled={selectedRows.length === 0}
  onClick={() => {
    if (selectedRows.length === 0) {
      alert("Please select at least one record.");
      return;
    }
    setShowExportModal(true);
  }}
  className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
>
  Export Data
</button>

{/* SELECT ALL RECORDS */}
          {data.length > 0 && (
  <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={(e) => {
        const checked = e.target.checked;
        setSelectAllAllPages(checked);

        if (checked) {
          const allIndexes = data.map((_, i) => i);
          setSelectedRows(allIndexes);
        } else {
          setSelectedRows([]);
        }
      }}
    />
    Select all records from all pages
  </div>
)}
        </div>
      </div>

      {/* TABLE */}
<div className="bg-white rounded-xl border mt-6 flex flex-col flex-1 overflow-hidden">

  {/* Header Title */}
  <div className="text-center py-3 font-semibold border-b">
  No. Of Accounts Fetched: {data.length}
</div>

  {/* Scroll Area */}
  <div className="flex-1 overflow-x-auto overflow-y-auto">
    <table className="min-w-[1800px] w-full text-sm border-collapse">

      <thead className="bg-slate-100 sticky top-0 z-20">
  <tr>

    {/* Page Select */}
    <th className="px-4 py-4 border text-center">
      <input
        type="checkbox"
        checked={selectAllPage}
        onChange={(e) => {
          const checked = e.target.checked;

          const pageIndexes = currentRecords.map(
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

    <th className="px-4 py-4 border">S. No.</th>

    {[
      "User Id",
      "User Name",
      "Branch Code",
      "Branch Name",
      "Account Number",
      "Customer Name",
      "Dpd Queue",
      "No. of Calls",
    ].map((col) => (
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
        {currentRecords.length > 0 ? (
  currentRecords.map((row, index) => {

    const globalIndex = indexOfFirstRecord + index;

    return (
      <tr key={globalIndex}>

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
        <td className="px-4 py-3 border">
          {globalIndex + 1}
        </td>

        <td className="px-6 py-3 border">{row.UserId}</td>
        <td className="px-6 py-3 border">{row.UserName}</td>
        <td className="px-6 py-3 border">{row.BranchCode}</td>
        <td className="px-6 py-3 border">{row.BranchName}</td>
        <td className="px-6 py-3 border">{row.AccountNumber}</td>
        <td className="px-6 py-3 border">{row.CustomerName}</td>
        <td className="px-6 py-3 border">
          {formatDPD(row.DpdQueue)}
        </td>
        <td className="px-6 py-3 border">{row.NoOfCalls}</td>

      </tr>
    );
  })
) : (
  <tr>
    <td colSpan={10} className="text-center py-16 text-slate-400 border">
      No records found
    </td>
  </tr>
)}
      </tbody>

    </table>
  </div>

{/* PAGINATION */}
{data.length > 0 && (
  <div className="flex justify-between items-center px-6 py-3 border-t bg-slate-50">

    <span className="text-sm text-slate-600">
      Showing {indexOfFirstRecord + 1} –
      {Math.min(indexOfLastRecord, data.length)} of {data.length}
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
</div>
{showExportModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg w-[500px]">
      <h2 className="text-lg font-semibold mb-4">Select Fields for PDF</h2>

      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {allColumns.map(col => (
          <label key={col.key} className="flex items-center gap-2">
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
            {col.label}
          </label>
        ))}
      </div>

      <div className="mt-4">
        <label className="text-sm">PDF File Name</label>
        <input
          type="text"
          value={pdfFileName}
          onChange={(e) => setPdfFileName(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
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
          Generate PDF
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AssignmentSummary;