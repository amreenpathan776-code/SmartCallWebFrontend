const SendSMS = () => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Filters */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        <Input label="Mobile Number" />
        <Select label="Cluster" />
        <Select label="Branch" />
        <Select label="Product" />
        <Select label="Assigned To" />

        <Input label="Pincode" />
        <Input label="Loan A/C Number" />
        <Select label="Queue" />
        <Select label="DPD Queue" />
        <Input label="Member Name" />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button className="px-4 py-2 bg-slate-200 rounded">Reset</button>
        <button className="px-4 py-2 bg-primary text-white rounded">
          Search
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" />
          Select all records from all pages
        </div>
      </div>

      {/* SMS Controls */}
      <div className="flex items-center gap-4 mb-6">
        <select className="px-3 py-2 border rounded bg-slate-100">
          <option>Select Template</option>
        </select>

        <button className="px-4 py-2 bg-slate-100 rounded">
          Preview SMS
        </button>

        <button className="px-4 py-2 bg-primary text-white rounded">
          Send
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">
                <input type="checkbox" />
              </th>
              <th className="p-3 text-left">First Name</th>
              <th className="p-3 text-left">Loan Account Number</th>
              <th className="p-3 text-left">Mobile Number</th>
              <th className="p-3 text-left">Branch</th>
              <th className="p-3 text-left">Product</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan="6"
                className="p-6 text-center text-slate-400"
              >
                No records found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-4 text-sm text-slate-500">
        ⏮ ◀ Page 0 of 0 ▶ ⏭
      </div>
    </div>
  );
};

/* Reusable Inputs */
const Input = ({ label }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <input className="w-full mt-1 px-3 py-2 border rounded bg-slate-100" />
  </div>
);

const Select = ({ label }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <select className="w-full mt-1 px-3 py-2 border rounded bg-slate-100">
      <option>Select</option>
    </select>
  </div>
);

export default SendSMS;
