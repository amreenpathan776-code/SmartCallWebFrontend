import { useState, useEffect } from "react";

// ✅ Logger (Same style as reference)
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

const LeadDataUpload = () => {
  const [fileName, setFileName] = useState("(no file uploaded yet)");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
const ROWS_PER_PAGE = 15;

const indexOfLastRecord = currentPage * ROWS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - ROWS_PER_PAGE;

const currentRecords = rows.slice(indexOfFirstRecord, indexOfLastRecord);

const totalPages = Math.max(
  1,
  Math.ceil(rows.length / ROWS_PER_PAGE)
);

useEffect(() => {
  logInfo("Pagination calculated", {
    currentPage,
    totalPages,
    totalRows: rows.length
  });
}, [currentPage, rows.length, totalPages]);

 const handleFileUpload = (e) => {
  logInfo("File upload triggered");
    const file = e.target.files && e.target.files[0];
logInfo("Selected file", file?.name);
if (file) {
  logInfo("File size (KB)", (file.size / 1024).toFixed(2));
}
    if (!file) {
  logWarn("No file selected");
  return;
}

    if (!file.name.toLowerCase().endsWith(".csv") && !file.name.toLowerCase().endsWith(".txt")) {
  logWarn("Invalid file format", file.name);
  alert("Only .csv or .txt files are allowed");
  return;
}

    setFileName(file.name);
logSuccess("File name set", file.name);

    const reader = new FileReader();
logInfo("Reading file started");
    reader.onload = (event) => {
  logSuccess("File read completed");
  parseCSV(event.target.result);
};
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const apiStart = performance.now();
    const startTime = performance.now();
  logInfo("CSV parsing started");
    const lines = text.split("\n").filter(l => l.trim() !== "");
logInfo("Total lines found", lines.length);
    if (!lines.length) {
  logWarn("CSV file is empty");
  logSuccess("CSV parsing completed in ms", performance.now() - startTime);
  logSuccess("API response time (ms)", performance.now() - apiStart);
  return;
}

    const headers = lines[0].split("|").map(h => h.trim());
logInfo("Headers extracted", headers);

    let rowIndex = 0;

const data = lines.slice(1).map(line => {
  const values = line.split("|");
  const obj = {};

  headers.forEach((h, i) => {
    const value = values[i] ? values[i].trim() : "";
    obj[h] = value;

    if (h === "SelectLead") {
      obj["SelectLeadType"] = value;
    }
  });

  // ✅ Log only first 20 rows
  if (rowIndex < 20) {
    logInfo("Row parsed", obj);
  }
  rowIndex++;

  return obj;
});
    logSuccess("Parsed data count", data.length);

    setRows(data);
logSuccess("Rows state updated");
setCurrentPage(1);
logInfo("Pagination reset to page 1");
  };

  // ================= UPLOAD TO BACKEND =================
  const uploadToDatabase = async () => {
  logInfo("Upload process started");
    if (rows.length === 0) {
  logWarn("No rows available to upload");
  return;
}

    setLoading(true);
logInfo("Loading started");

    try {
      logInfo("Calling upload API", { totalRecords: rows.length });
      const userId = localStorage.getItem("userId");
logInfo("User ID fetched", userId);
logInfo("Full rows data before upload", rows);
      const response = await fetch("https://mobile.coastal.bank.in:5001/api/leads/upload", {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  "x-user-id": userId
},
        body: JSON.stringify(rows)
      });

      const result = await response.json();
logSuccess("API response received", result);

if (!response.ok) {
  logError("Upload failed from server", result);
  throw new Error(result.message || "Upload failed");
}

      alert(`Successfully uploaded ${result.count} records`);
      logSuccess("Upload successful", result.count);
      setRows([]);
      setFileName("(no file uploaded yet)");
      logInfo("State reset after upload");

    } catch (error) {
      logError("Upload exception occurred", error);
      alert(error.message || "Failed to upload data");
    } finally {
  setLoading(false);
  logInfo("Loading ended");
}
  };

  const role = localStorage.getItem("role");

  logInfo("User role check", role);
const isAdmin =
  role === "Admin" || role === "Super Admin";

if (!isAdmin) {
  logWarn("Unauthorized access attempt", role);
  return (
    <div className="bg-white rounded-xl shadow p-10 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-4">
        Access Restricted
      </h2>
      <p className="text-slate-600 text-lg">
        Please contact Admin to access this page.
      </p>
    </div>
  );
}

  return (
    <main className="flex-1 p-6 bg-slate-100">
      <div className="bg-white rounded-xl shadow p-6">

        {/* UPLOAD SECTION */}
        <div className="flex gap-4 mt-6 mb-6">
          <div>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 w-[320px] text-center">
              <label className="px-4 py-2 bg-primary text-white rounded cursor-pointer inline-block">
                Upload File...
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <p className="text-sm text-slate-500 mt-2">⬆ Drop file here</p>
            </div>

            <p className="text-sm text-slate-400 mt-2">
              {fileName}
            </p>

  <button
    onClick={uploadToDatabase}
    disabled={!rows.length || loading}
    className={`px-4 py-2 rounded text-white ${
      loading
        ? "bg-blue-400 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700"
    }`}
  >
    {loading ? "Uploading..." : "Upload To Database"}
  </button>

</div>

          <p className="text-sm text-slate-600 mt-2">
  No of Records fetched: {rows.length}
</p>
        </div>

        {/* TABLE */}
        <div className="border rounded-lg overflow-auto">
  <table className="w-full text-sm border border-slate-300">

    <thead className="bg-slate-100">
      <tr>
        <th className="p-3 border border-slate-300 text-left">S. No</th>
        <th className="p-3 border border-slate-300 text-left">Full Name</th>
        <th className="p-3 border border-slate-300 text-left">DOB</th>
        <th className="p-3 border border-slate-300 text-left">Mobile Number</th>
        <th className="p-3 border border-slate-300 text-left">Branch Code</th>
        <th className="p-3 border border-slate-300 text-left">Branch Name</th>
        <th className="p-3 border border-slate-300 text-left">Cluster</th>
        <th className="p-3 border border-slate-300 text-left">Product</th>
        <th className="p-3 border border-slate-300 text-left">Lead Type</th>
      </tr>
    </thead>

    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan="9" className="p-6 border border-slate-300 text-center text-slate-400">
            No records found
          </td>
        </tr>
      ) : (
        currentRecords.map((row, index) => {
          const serialNumber =
            (currentPage - 1) * ROWS_PER_PAGE + index + 1;

          return (
            <tr key={index} className="hover:bg-slate-50">

  <td className="p-3 border border-slate-300">
    {serialNumber}
  </td>

  <td className="p-3 border border-slate-300">
    {row.FullName || row.FirstName || ""}
  </td>

  <td className="p-3 border border-slate-300">{row.DOB || ""}</td>
  <td className="p-3 border border-slate-300">{row.MobileNumber || ""}</td>
  <td className="p-3 border border-slate-300">{row.BranchCode || ""}</td>
  <td className="p-3 border border-slate-300">{row.BranchName || ""}</td>
  <td className="p-3 border border-slate-300">{row.ClusterName || ""}</td>
  <td className="p-3 border border-slate-300">
    {row.SelectProduct || row.ProductCategory || ""}
  </td>
  <td className="p-3 border border-slate-300">{row.SelectLeadType || ""}</td>

</tr>
          );
        })
      )}
    </tbody>

  </table>
</div>

{rows.length > 0 && (
  <div className="flex items-center justify-between mt-4 text-sm text-slate-600">

    <div>
      Showing {indexOfFirstRecord + 1}–
      {Math.min(indexOfLastRecord, rows.length)} of {rows.length}
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

      <span>
        Page {currentPage} of {totalPages}
      </span>

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

{loading && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-sm font-medium">Uploading...</p>
    </div>
  </div>
)}

      </div>
    </main>
  );
};

export default LeadDataUpload;
