import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = "http://40.80.79.26:5001";

const BorrowersContactedByPhone = () => {

  const [currentPage, setCurrentPage] = useState(1);
const recordsPerPage = 15;

  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedCluster, setSelectedCluster] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);
const [selectAllPage, setSelectAllPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

const [showExportModal, setShowExportModal] = useState(false);
const [exportFileName, setExportFileName] = useState("Borrowers_Contacted_Report");

const [selectedColumns, setSelectedColumns] = useState([
  "serialNumber",
  "employeeId",
  "employeeName",
  "accountNumber",
  "branchName",
  "borrowerName",
  "dateOfCall",
  "numberContacted",
  "flow"
]);


  // ================= LOAD CLUSTERS =================
  const fetchClusters = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/clusters`);
      setClusters(["Corporate Office", ...res.data.map(c => c.cluster_name)]);
    } catch (error) {
      console.error("Error fetching clusters:", error);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  useEffect(() => {

  const loadUsersAndBranches = async () => {

    // ✅ NOTHING SELECTED → Load ALL
    if (!selectedCluster && !selectedBranch) {

      const branchesRes = await axios.get(`${BASE_URL}/api/branches/all`);
      setBranches(branchesRes.data || []);

      const usersRes = await axios.post(`${BASE_URL}/api/users/list`, {
        page: 1,
        pageSize: 1000,
        cluster: "",
        branch: "",
        name: ""
      });

      setUsers(usersRes.data.records || []);
      return;
    }

    // ✅ CORPORATE OFFICE → Load ALL
    if (selectedCluster === "Corporate Office") {

      const branchesRes = await axios.get(`${BASE_URL}/api/branches/all`);
      setBranches(branchesRes.data || []);

      const usersRes = await axios.post(`${BASE_URL}/api/users/list`, {
        page: 1,
        pageSize: 1000,
        cluster: "",
        branch: "",
        name: ""
      });

      setUsers(usersRes.data.records || []);
      return;
    }

    // ✅ CLUSTER ONLY SELECTED
    if (selectedCluster && !selectedBranch) {

      const branchesRes = await axios.get(
        `${BASE_URL}/api/branches/${selectedCluster}`
      );
      setBranches(branchesRes.data || []);

      const usersRes = await axios.post(`${BASE_URL}/api/users/list`, {
        page: 1,
        pageSize: 1000,
        cluster: selectedCluster,
        branch: "",
        name: ""
      });

      setUsers(usersRes.data.records || []);
      return;
    }

    // ✅ CLUSTER + BRANCH SELECTED
    if (selectedCluster && selectedBranch) {

      const usersRes = await axios.post(`${BASE_URL}/api/users/list`, {
        page: 1,
        pageSize: 1000,
        cluster: selectedCluster,
        branch: selectedBranch,
        name: ""
      });

      setUsers(usersRes.data.records || []);
      return;
    }
  };

  loadUsersAndBranches();

  setSelectedUser("");

}, [selectedCluster, selectedBranch]);

  // ================= SEARCH =================
  const handleSearch = async () => {

  const hasAnyFilter = [
    selectedCluster,
    selectedBranch,
    selectedUser,
    fromDate,
    toDate
  ].some(v => v && v.trim() !== "");

  if (!hasAnyFilter) {
    alert("Please select at least one filter before searching");
    return;  // ❌ stop API call
  }

  setLoading(true);

  try {
    const res = await axios.post(
      `${BASE_URL}/api/borrowers-contacted/search`,
      {
        cluster: selectedCluster,
        branch: selectedBranch,
        userId: selectedUser,
        fromDate,
        toDate
      }
    );

    setTableData(res.data || []);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAllPage(false);
    setSelectAllAllPages(false);

  } catch (error) {
    console.error("Search error:", error);
  }

  setLoading(false);
};

  // ================= RESET =================
  const handleReset = () => {
    setSelectedCluster("");
    setSelectedBranch("");
    setSelectedUser("");
    setFromDate("");
    setToDate("");
    setBranches([]);
    setUsers([]);
    setTableData([]);
    setCurrentPage(1);
  };


  const totalPages = Math.max(
  1,
  Math.ceil(tableData.length / recordsPerPage)
);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = tableData.slice(indexOfFirstRecord, indexOfLastRecord);

useEffect(() => {
  const pageIndexes = tableData
    .slice(indexOfFirstRecord, indexOfLastRecord)
    .map((_, i) => indexOfFirstRecord + i);

  const allSelected =
    pageIndexes.length > 0 &&
    pageIndexes.every(id => selectedRows.includes(id));

  setSelectAllPage(allSelected);
}, [
  currentPage,
  selectedRows,
  tableData,
  indexOfFirstRecord,
  indexOfLastRecord
]);

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
    const response = await axios.post(
      `${BASE_URL}/api/borrowers-contacted/export-pdf`,
      {
        selectedIndexes: selectedRows,
        columns: selectedColumns,
        fileName: exportFileName,
        fullData: tableData
      },
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.pdf`;
    link.click();

    setShowExportModal(false);

  } catch (err) {
    alert("Failed to export PDF");
  }
};

  // ================= UI =================
  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">

      {/* ================= FILTERS ================= */}
      <div className="bg-white rounded-xl p-6 shrink-0">
        <div className="grid grid-cols-5 gap-6">

          <div>
            <label className="text-sm text-slate-600">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.userName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Cluster</label>
            <select
              value={selectedCluster}
              onChange={(e) => {
                setSelectedCluster(e.target.value);
                setSelectedBranch("");
                setSelectedUser("");
              }}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {clusters.map((cluster, index) => (
                <option key={index} value={cluster}>
                  {cluster}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setSelectedUser("");
              }}
              className="w-full mt-1 px-3 py-2 bg-slate-100 border rounded"
            >
              <option value="">Select</option>
              {branches.map((branch) => (
                <option key={branch.branch_code} value={branch.branch_name}>
                  {branch.branch_name}
                </option>
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

{tableData.length > 0 && (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        checked={selectAllAllPages}
        onChange={(e) => {
          const checked = e.target.checked;
          setSelectAllAllPages(checked);

          if (checked) {
            const allIndexes = tableData.map((_, i) => i);
            setSelectedRows(allIndexes);
          } else {
            setSelectedRows([]);
          }
        }}
      />
      Select all records from all Pages
    </label>
  )}

        </div>
      </div>

      {/* ================= SELECT ALL RECORDS ================= */}
      <div className="bg-white rounded-xl border mt-6 flex flex-col flex-1 overflow-hidden">

        <div className="flex-1 overflow-x-auto overflow-y-auto relative">

          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-lg font-semibold z-50">
              Loading...
            </div>
          )}

{/* ================= TABLE ================= */}
          <table className="min-w-[1600px] w-full text-sm border-collapse">
  <thead className="bg-slate-100 sticky top-0 z-20">
  <tr>
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

    {[
      "S. No.",
      "Employee Id",
      "Employee Name",
      "Account Number",
      "Branch Name",
      "Borrower Name",
      "Date Of Call",
      "Number Contacted",
      "Flow",
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
  {currentRecords.length === 0 ? (
    <tr>
      <td colSpan={10} className="text-center py-16 text-slate-400 border">
        No records found
      </td>
    </tr>
  ) : (
    currentRecords.map((row, index) => {
      const globalIndex = indexOfFirstRecord + index;

      return (
        <tr key={globalIndex}>
          <td className="border px-4 py-2 text-center">
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

          <td className="border px-4 py-2">
            {globalIndex + 1}
          </td>

          <td className="border px-4 py-2">{row.employeeId}</td>
          <td className="border px-4 py-2">{row.employeeName}</td>
          <td className="border px-4 py-2">{row.accountNumber}</td>
          <td className="border px-4 py-2">{row.branchName}</td>
          <td className="border px-4 py-2">{row.borrowerName}</td>
          <td className="border px-4 py-2">{row.dateOfCall}</td>
          <td className="border px-4 py-2">{row.numberContacted}</td>
          <td className="border px-4 py-2" style={{ whiteSpace: "pre-line" }}>
            {row.flow}
          </td>
        </tr>
      );
    })
  )}
</tbody>
</table>
        </div>


{/* ================= PAGINATION ================= */}
        {tableData.length > 0 && (
  <div className="flex justify-between items-center px-6 py-3 border-t bg-slate-50">

    <span className="text-sm text-slate-600">
      Showing {indexOfFirstRecord + 1} –
      {Math.min(indexOfLastRecord, tableData.length)} of {tableData.length}
    </span>

    <div className="flex gap-2">

      {/* First */}
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        ⏮
      </button>

      {/* Previous */}
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(p => p - 1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        ◀
      </button>

      {/* Page Info */}
      <span className="px-3 py-1 text-sm">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(p => p + 1)}
        className="px-3 py-1 border rounded disabled:opacity-40"
      >
        ▶
      </button>

      {/* Last */}
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
          "employeeId",
          "employeeName",
          "accountNumber",
          "branchName",
          "borrowerName",
          "dateOfCall",
          "numberContacted",
          "flow"
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
  );
};

export default BorrowersContactedByPhone;
