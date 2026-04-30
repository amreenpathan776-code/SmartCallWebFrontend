import { useState } from "react";
import * as XLSX from "xlsx";

// ✅ Logger
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

const SMAUpload = () => {

  const [fileData, setFileData] = useState([]);
  const [file, setFile] = useState(null);

  const [statusModal, setStatusModal] = useState(false);
const [statusData, setStatusData] = useState(null);
const [uploading, setUploading] = useState(false);

const [currentPage, setCurrentPage] = useState(1);
const ROWS_PER_PAGE = 15;

const indexOfLastRecord = currentPage * ROWS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - ROWS_PER_PAGE;

const currentRecords = fileData.slice(
  indexOfFirstRecord,
  indexOfLastRecord
);

const totalPages = Math.max(
  1,
  Math.ceil(fileData.length / ROWS_PER_PAGE)
);

  const role = localStorage.getItem("role");

logInfo("User role fetched", role);

const isAdmin =
  role === "Admin" || role === "Super Admin";

if (isAdmin) {
  logSuccess("Authorized user access granted");
}

if (!isAdmin) {
  logWarn("Unauthorized access attempt");

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

  // ================= FILE UPLOAD HANDLER =================
  const handleFileUpload = (e) => {
    logInfo("File upload triggered");

    const uploadedFile = e.target.files[0];
    logInfo("File selected", uploadedFile?.name);
    if (!uploadedFile) {
  logWarn("No file selected");
  return;
}

    setFile(uploadedFile);
    logSuccess("File stored in state");

    const reader = new FileReader();

    reader.onload = (evt) => {
      logInfo("Reading file started");

      const data = new Uint8Array(evt.target.result);

      const workbook = XLSX.read(data, { type: "array" });
      logSuccess("Workbook parsed");

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet);
      logSuccess("Sheet converted to JSON", { count: jsonData.length });

      const previewData = jsonData.map((row, index) => ({
        sno: index + 1,
        bc: row["BC"],
        branch: row["Branch Name"],
        region: row["Rgn"],
        account: row["Account Name"],
        loanType: row["Loan Type"]
      }));

      setFileData(previewData);
      logSuccess("Preview data prepared", { count: previewData.length });
setCurrentPage(1); // ✅ ADD THIS
logInfo("Pagination reset to page 1");

    };

logInfo("Starting file read as ArrayBuffer");
    reader.readAsArrayBuffer(uploadedFile);
  };

  // ================= UPLOAD TO DATABASE =================
  const uploadToDatabase = async () => {
    logInfo("Upload process started");

  if (!file) {
  logWarn("Upload attempted without file");
  alert("Please upload a file");
  return;
}

  const formData = new FormData();
  logInfo("Preparing form data");
  formData.append("file", file);
  logInfo("File appended to formData", file.name);

  try {
    logInfo("Calling upload API");

    setUploading(true);
    logInfo("Uploading state set to TRUE");

    const res = await fetch("https://mobile.coastal.bank.in:5001/api/sma/upload", {
  method: "POST",
  headers: {
    "x-user-id": localStorage.getItem("userId")
  },
  body: formData
});

    const data = await res.json();
    logSuccess("Upload API response received", data);

    setStatusData(data);
    logInfo("Status data stored");
    setStatusModal(true);
    logInfo("Status modal opened");

    setFile(null);
    setFileData([]);
    logSuccess("State cleared after upload");

    const input = document.getElementById("fileUpload");
    if (input) input.value = "";
    logInfo("File input cleared");

  } catch (error) {

    logError("Upload failed", error);
    alert("Upload failed");

  } finally {
    setUploading(false);
    logInfo("Uploading state set to FALSE");
  }
};

  return (
    <div className="flex justify-center p-6 w-full">

      <div className="bg-white rounded-xl shadow-sm border w-full max-w-6xl p-6">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">SMA Upload</h2>

          <p className="text-sm text-slate-600">
            No of Records fetched: {fileData.length}
          </p>
        </div>

        {/* ================= FILE UPLOAD ================= */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 w-64 text-center mb-4">

  <input
    type="file"
    accept=".xlsx,.xls,.csv"
    onChange={handleFileUpload}
    id="fileUpload"
    className="hidden"
  />

  <button
    onClick={() => document.getElementById("fileUpload").click()}
    className="bg-blue-600 text-white px-4 py-2 rounded"
  >
    Upload File...
  </button>

  <p className="text-sm text-slate-500 mt-2">Drop file here</p>

  <p className="text-xs text-slate-400 mt-2">
    {file ? file.name : "(no file uploaded yet)"}
  </p>

</div>

        {/* ================= BUTTONS ================= */}
        <div className="flex gap-4 mt-6 mb-6">

          <button
  onClick={uploadToDatabase}
  disabled={!fileData.length || uploading}
  className={`px-4 py-2 rounded text-white ${
    uploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600"
  }`}
>
  {uploading ? "Uploading..." : "Upload To Database"}
</button>

<button
  className="bg-blue-600 text-white px-4 py-2 rounded"
  onClick={async () => {
    logInfo("Manual status fetch clicked");

    try {
      logInfo("Calling status API");

      const res = await fetch(
        "https://mobile.coastal.bank.in:5001/api/sma/upload-status",
        {
          headers: {
            "x-user-id": localStorage.getItem("userId")
          }
        }
      );

      const data = await res.json();
      logSuccess("Status API response", data);

      setStatusData(data);
      setStatusModal(true);

    } catch (err) {

      logError("Status fetch failed", err);
      alert("Failed to fetch upload status");

    }

  }}
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
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => setStatusModal(false)}
        >
          Close
        </button>
      </div>

    </div>

  </div>

)}


        {/* ================= TABLE ================= */}
        <div className="border rounded-lg overflow-hidden">
  <table className="w-full text-sm border border-slate-300">

    <thead className="bg-slate-100">
      <tr>
        <th className="p-3 border border-slate-300 text-left">S. No</th>
        <th className="p-3 border border-slate-300 text-left">Branch Code</th>
        <th className="p-3 border border-slate-300 text-left">Branch Name</th>
        <th className="p-3 border border-slate-300 text-left">Region</th>
        <th className="p-3 border border-slate-300 text-left">Account Name</th>
        <th className="p-3 border border-slate-300 text-left">Loan Type</th>
      </tr>
    </thead>

    <tbody>
      {fileData.length === 0 ? (
        <tr>
          <td colSpan="6" className="text-center p-6 text-slate-400">
            No records found
          </td>
        </tr>
      ) : (
        currentRecords.map((row, index) => {
          const serialNumber =
            (currentPage - 1) * ROWS_PER_PAGE + index + 1;

          return (
            <tr key={index}>
              <td className="p-3 border border-slate-300">{serialNumber}</td>
              <td className="p-3 border border-slate-300">{row.bc}</td>
              <td className="p-3 border border-slate-300">{row.branch}</td>
              <td className="p-3 border border-slate-300">{row.region}</td>
              <td className="p-3 border border-slate-300">{row.account}</td>
              <td className="p-3 border border-slate-300">{row.loanType}</td>
            </tr>
          );
        })
      )}
    </tbody>

  </table>
</div>

{fileData.length > 0 && (
  <div className="flex items-center justify-between mt-4 text-sm text-slate-600">

    <div>
      Showing {indexOfFirstRecord + 1}–
      {Math.min(indexOfLastRecord, fileData.length)} of {fileData.length}
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

{uploading && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-3 text-sm font-medium">Uploading...</p>
    </div>
  </div>
)}

        </div>

        
      </div>

  );

};

export default SMAUpload;