const OfferDataUpload = () => {

  const role = localStorage.getItem("role");
const isBranchManager = role === "Branch Manager";

if (isBranchManager) {
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
    <main className="flex-1 p-6 bg-slate-100">
      <div className="bg-white rounded-xl shadow p-6">
        {/* ================= UPLOAD SECTION ================= */}
        <div className="flex items-start justify-between mb-6 gap-6">
          <div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 w-full max-w-[520px] h-[180px] flex flex-col items-center justify-center text-center">
              <button className="px-4 py-2 bg-primary text-white rounded mb-2">
                Upload File...
              </button>
              <p className="text-sm text-slate-500">
                ⬆ Drop file here
              </p>
            </div>

            <p className="text-sm text-slate-400 mt-2">
              (no file uploaded yet)
            </p>

            <button className="mt-4 px-4 py-2 bg-slate-200 rounded">
              Upload to Database
            </button>
          </div>

          <div className="text-lg font-semibold text-slate-700">
            No of Records fetched
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Lead Name</th>
                <th className="p-3 text-left">Mobile Number</th>
                <th className="p-3 text-left">Branch Name</th>
                <th className="p-3 text-left">Product Offered</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan="4"
                  className="p-6 text-center text-slate-400"
                >
                  No records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default OfferDataUpload;
