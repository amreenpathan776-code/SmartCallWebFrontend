import { useState } from "react";

const LeadDataUpload = () => {
  const [fileName, setFileName] = useState("(no file uploaded yet)");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".psv")) {
      alert("Only .psv files are allowed");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      parsePSV(event.target.result);
    };
    reader.readAsText(file);
  };

  const parsePSV = (text) => {
    const lines = text.split("\n").filter(l => l.trim() !== "");
    if (!lines.length) return;

    const headers = lines[0].split("|").map(h => h.trim());

    const data = lines.slice(1).map(line => {
      const values = line.split("|");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ? values[i].trim() : "";
      });
      return obj;
    });

    setRows(data);
  };

  // ================= UPLOAD TO BACKEND =================
  const uploadToDatabase = async () => {
    if (rows.length === 0) return;

    setLoading(true);

    try {
      const response = await fetch("http://40.80.79.26:5001/api/leads/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(rows)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      alert(`Successfully uploaded ${result.count} records`);
      setRows([]);
      setFileName("(no file uploaded yet)");

    } catch (error) {
      console.error(error);
      alert("Failed to upload data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 bg-slate-100">
      <div className="bg-white rounded-xl shadow p-6">

        {/* UPLOAD SECTION */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 w-[320px] text-center">
              <label className="px-4 py-2 bg-primary text-white rounded cursor-pointer inline-block">
                Upload File...
                <input
                  type="file"
                  accept=".psv"
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
              className="mt-4 px-4 py-2 bg-slate-200 rounded"
              disabled={rows.length === 0 || loading}
              onClick={uploadToDatabase}
            >
              {loading ? "Uploading..." : "Upload to Database"}
            </button>
          </div>

          <div className="text-lg font-semibold text-slate-700">
            No of Records fetched: {rows.length}
          </div>
        </div>

        {/* TABLE */}
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
  <tr>
    <th className="p-3 text-left">Full Name</th>
    <th className="p-3 text-left">DOB</th>
    <th className="p-3 text-left">Mobile Number</th>
    <th className="p-3 text-left">Branch Code</th>
    <th className="p-3 text-left">Branch Name</th>
    <th className="p-3 text-left">Cluster</th>
    <th className="p-3 text-left">Product</th>
    <th className="p-3 text-left">Lead Type</th>
  </tr>
</thead>

            <tbody>
  {rows.length === 0 ? (
    <tr>
      <td colSpan="8" className="p-6 text-center text-slate-400">
        No records found
      </td>
    </tr>
  ) : (
    rows.map((row, index) => (
      <tr key={index} className="border-t">
        <td className="p-3">{row.FullName || row.FirstName || ""}</td>
        <td className="p-3">{row.DOB || ""}</td>
        <td className="p-3">{row.MobileNumber || ""}</td>
        <td className="p-3">{row.BranchCode || ""}</td>
        <td className="p-3">{row.BranchName || ""}</td>
        <td className="p-3">{row.ClusterName || ""}</td>
        <td className="p-3">{row.SelectProduct || row.ProductCategory || ""}</td>
        <td className="p-3">{row.SelectLeadType || ""}</td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>

      </div>
    </main>
  );
};

export default LeadDataUpload;
