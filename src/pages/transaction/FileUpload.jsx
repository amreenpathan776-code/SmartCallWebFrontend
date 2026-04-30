import { useState } from "react";
import axios from "axios";

// ✅ Logger (Same style as Transaction)
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

const FileUpload = () => {
  const [file, setFile] = useState(null);
const [records, setRecords] = useState([]);
const [statusModal, setStatusModal] = useState(false);
const [statusData, setStatusData] = useState(null);
const [uploading, setUploading] = useState(false);

const [currentPage, setCurrentPage] = useState(1);
const ROWS_PER_PAGE = 15;

  const parsePSV = (file) => {
    logInfo("File parsing started", file.name);
  const reader = new FileReader();
  reader.onload = () => {
    logSuccess("File read successfully");
    const text = reader.result;

    // Split into lines
    const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

    // Header = first line
    const headers = lines[0].split("|").map(h => h.trim());

    // Convert each row into a JSON object
    const json = lines.slice(1).map(line => {
      const values = line.split("|");
      let obj = {};
      headers.forEach((h, i) => {
  const key = h.trim();

  const map = {
    currentOutStandingBalance: "currentOutstandingBalance"
  };

  obj[map[key] || key] = values[i] || null;
});
      return obj;
    });

    logSuccess("Parsed records", { count: json.length });
    setRecords(json);
    setCurrentPage(1);
  };

  reader.readAsText(file);
};

  const handleFileChange = (e) => {
  const selected = e.target.files[0];
  logInfo("File selected", selected?.name);
  if (selected && selected.name.toLowerCase().endsWith(".csv")) {
  logSuccess("Valid CSV file selected");
  setFile(selected);
  parsePSV(selected);
} else {
  logWarn("Invalid file format selected");
  alert("Only .CSV files are allowed");
}
};

const uploadToDB = async () => {
  logInfo("Upload process started");
  try {
    setUploading(true);

    const userId = localStorage.getItem("userId");
    logInfo("User ID fetched", userId);

logInfo("Calling Upload API", { totalRecords: records.length });
    await axios.post(
      "https://mobile.coastal.bank.in:5001/api/recovery-upload",
      { records },
      {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        }
      }
    );
    logSuccess("Upload API success");


logInfo("Fetching upload status");
    // 🔹 After upload, fetch status from same API
    const statusRes = await axios.get(
      "https://mobile.coastal.bank.in:5001/api/recovery-upload-status",
      {
        headers: { "x-user-id": userId }
      }
    );

logSuccess("Upload status received", statusRes.data);
    setStatusData(statusRes.data);
    setStatusModal(true);

    // Clear after showing modal
    setRecords([]);
    setFile(null);
    setCurrentPage(1);
    logSuccess("Upload process completed & state reset");

  } catch (err) {
  logError("Upload failed", err);
    alert("Upload Failed!");
  } finally {
    setUploading(false);
  }
};

const fetchUploadStatus = async () => {
  logInfo("Manual status fetch clicked");
  try {
    const userId = localStorage.getItem("userId");

    logInfo("Calling status API");
const res = await axios.get(
  "https://mobile.coastal.bank.in:5001/api/recovery-upload-status",
  {
    headers: {
      "x-user-id": userId
    }
  }
);

logSuccess("Status API success", res.data);
    setStatusData(res.data);
    setStatusModal(true);
  } catch (err) {
  logError("Status fetch failed", err);
    alert("Failed to fetch upload status");
  }
};

const indexOfLastRecord = currentPage * ROWS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - ROWS_PER_PAGE;

const currentRecords = records.slice(
  indexOfFirstRecord,
  indexOfLastRecord
);

const totalPages = Math.max(
  1,
  Math.ceil(records.length / ROWS_PER_PAGE)
);

  const role = localStorage.getItem("role") || "";

const isRestricted =
  role === "Branch Manager" ||
  role.includes("Regional Manager");

if (isRestricted) {
    return (
      <div className="bg-white rounded-xl shadow p-10 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          Access Restricted
        </h2>
        <p className="text-slate-600 text-lg">
          Please Contact Admin to access this Page.
        </p>
      </div>
    );
  }
  
return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Upload Box */}
      <div className="border-2 border-dashed rounded-lg p-6 w-1/2 text-center">
  <input
  type="file"
  accept=".csv"
  style={{ display: "none" }}
  id="csvInput"
  onChange={handleFileChange}
  value=""
/>

  <button
    className="px-4 py-2 bg-primary text-white rounded"
    onClick={() => document.getElementById("csvInput").click()}
  >
    Upload File (.CSV)
  </button>

  <p className="text-slate-400 mt-2">
    {file ? file.name : "No file uploaded yet"}
  </p>
</div>

      {/* Actions */}
      <div className="flex gap-4 mt-6 mb-6">
        <button
  className={`px-4 py-2 rounded text-white transition-all duration-300
    ${uploading ? "bg-blue-700 animate-pulse scale-95" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}
  `}
  onClick={uploadToDB}
  disabled={!records.length || uploading}
>
  {uploading ? "Uploading..." : "Upload To Database"}
</button>

        <button
  className="px-4 py-2 bg-primary text-white rounded"
  onClick={fetchUploadStatus}
>
  File Upload Status
</button>
      </div>
{statusModal && statusData && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-[400px] p-6 relative">
      <button
        className="absolute top-3 right-3 text-xl"
        onClick={() => setStatusModal(false)}
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold mb-4">
        File Upload Status
      </h2>

      <p className="mb-2 font-medium text-green-600">
        File Uploaded Successfully
      </p>

      <div className="space-y-2 text-sm">
        <p>No of records archived : <b>{statusData.archived}</b></p>
        <p>New records : <b>{statusData.uploaded}</b></p>
        <p>Total no of records uploaded : <b>{statusData.history_total}</b></p>
      </div>

      <div className="mt-4 text-right">
        <button
          className="px-4 py-2 bg-primary text-white rounded"
          onClick={() => setStatusModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

{/* Center Loading Spinner */}
{uploading && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-sm font-medium">Uploading...</p>
    </div>
  </div>
)}

      {/* Data Table */}
      {/* Uploaded File Data Table */}
<div className="border rounded-lg overflow-x-auto">
  <table className="w-full text-sm">
    <thead className="border-b bg-white">
      <tr className="text-slate-700">
        {[
          "S. No.",
          "First Name",
          "Date of Birth",
          "Mobile Number",
          "Branch Code",
          "Branch Name",
          "Loan A/c #",
        ].map((h) => (
          <th
            key={h}
            className="p-4 text-left font-medium cursor-pointer select-none"
          >
            {h} <span className="text-slate-400">▲▼</span>
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
  {records.length === 0 ? (
    <tr>
      <td
        colSpan={7}
        className="p-8 border border-slate-300 text-center text-slate-400"
      >
        No records found
      </td>
    </tr>
  ) : (
    currentRecords.map((row, idx) => {
      const serialNumber =
        (currentPage - 1) * ROWS_PER_PAGE + idx + 1;

      return (
        <tr key={idx}>
          <td className="p-3 border border-slate-300">
            {serialNumber}
          </td>
          <td className="p-3 border border-slate-300">
            {row.firstname}
          </td>
          <td className="p-3 border border-slate-300">
            {row.dob}
          </td>
          <td className="p-3 border border-slate-300">
            {row.mobileNumber}
          </td>
          <td className="p-3 border border-slate-300">
            {row.branchCode}
          </td>
          <td className="p-3 border border-slate-300">
            {row.branchName}
          </td>
          <td className="p-3 border border-slate-300">
            {row.loanAccountNumber}
          </td>
        </tr>
      );
    })
  )}
</tbody>
  </table>
</div>


{/* Pagination */}
{records.length > 0 && (
  <div className="flex items-center justify-between mt-4 text-sm text-slate-600">

    <div>
      Showing {indexOfFirstRecord + 1}–
      {Math.min(indexOfLastRecord, records.length)} of {records.length}
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


</div>
  );
};

export default FileUpload;
