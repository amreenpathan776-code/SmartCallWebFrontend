import { useState, useEffect } from "react";

const Branch = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterName, setFilterName] = useState("");
const [filterCode, setFilterCode] = useState("");

const [branches, setBranches] = useState([]);

const RECORDS_PER_PAGE = 15;

const [currentPage, setCurrentPage] = useState(1);
const [selectedRows, setSelectedRows] = useState([]);
const [selectAllCurrentPage, setSelectAllCurrentPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);

const [showMapModal, setShowMapModal] = useState(false);
const [selectedLocation, setSelectedLocation] = useState("");

const [formData, setFormData] = useState({
  branchCode: "",
  branchName: "",
  email: "",
  category: "",
  type: "",
  parent: "",
  address: "",
  pincode: "",
  locationLink: "" 
});

const handleSearch = async () => {
  const response = await fetch(
    `http://40.80.79.26:5001/api/branch-master?name=${filterName}&code=${filterCode}`
  );

  const data = await response.json();
  setBranches(Array.isArray(data) ? data : []);
  setCurrentPage(1);
};

const handleReset = async () => {
  setFilterName("");
  setFilterCode("");

  const response = await fetch("http://40.80.79.26:5001/api/branch-master")
  const data = await response.json();
  setBranches(Array.isArray(data) ? data : []);
  setCurrentPage(1);
};

const handleSave = async () => {
  const isEdit = branches.some(
    b => b.branchCode === formData.branchCode
  );

  const method = isEdit ? "PUT" : "POST";
  const url = isEdit
    ? `http://40.80.79.26:5001/api/branch-master/${formData.branchCode}`
    : "http://40.80.79.26:5001/api/branch-master";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      BranchCode: formData.branchCode,
      BranchName: formData.branchName,
      BranchEmailId: formData.email,
      BranchCategory: formData.category,
      BranchType: formData.type,
      ParentBranch: formData.parent,
      Address: formData.address,
      Pincode: formData.pincode,
      Status: 1,
      Location: formData.locationLink
    })
  });

  await handleReset();   // reload sorted data
  setShowForm(false);
};

const handleDelete = async () => {
  if (selectedRows.length === 0) {
    alert("Please select at least one branch to delete");
    return;
  }

  const confirmed = window.confirm("Are you sure you want to delete selected branches?");
  if (!confirmed) return;

  for (let code of selectedRows) {
    await fetch(`http://40.80.79.26:5001/api/branch-master/${code}`, {
      method: "DELETE"
    });
  }

  setBranches(prev =>
    prev.filter(branch => !selectedRows.includes(branch.branchCode))
  );

  setSelectedRows([]);
};

useEffect(() => {
  handleReset(); // load all branches on page load
}, []);

const totalPages = Math.ceil(branches.length / RECORDS_PER_PAGE);

const indexOfLastRecord = currentPage * RECORDS_PER_PAGE;
const indexOfFirstRecord = indexOfLastRecord - RECORDS_PER_PAGE;

const currentRecords = branches.slice(
  indexOfFirstRecord,
  indexOfLastRecord
);

const handleRowSelect = (branchCode) => {
  let updatedSelection;

  if (selectedRows.includes(branchCode)) {
    updatedSelection = selectedRows.filter(id => id !== branchCode);
  } else {
    updatedSelection = [...selectedRows, branchCode];
  }

  setSelectedRows(updatedSelection);

  const currentPageIDs = currentRecords.map(b => b.branchCode);

  setSelectAllCurrentPage(
    currentPageIDs.every(id => updatedSelection.includes(id))
  );

  setSelectAllAllPages(
    branches.length > 0 &&
    branches.every(b => updatedSelection.includes(b.branchCode))
  );
};

  return (
    <div className="p-4 w-full">

      {/* ================= FILTER BAR ================= */}
      <div className="flex items-center gap-3 mb-3">
        <input
  type="text"
  placeholder="Filter by name..."
  value={filterName}
  onChange={(e) => setFilterName(e.target.value)}
  className="border rounded px-3 py-2 text-sm w-56"
/>

<input
  type="text"
  placeholder="Filter by branch code"
  value={filterCode}
  onChange={(e) => setFilterCode(e.target.value)}
  className="border rounded px-3 py-2 text-sm w-56"
/>

        <button
  onClick={handleSearch}
  className="px-4 py-2 bg-blue-600 text-white text-sm rounded"
>
  Search
</button>

        {/* ✅ ADD BRANCH BUTTON */}
        <button
  onClick={() => {
    setFormData({
      branchCode: "",
      branchName: "",
      email: "",
      category: "",
      type: "",
      parent: "",
      address: "",
      pincode: "",
      locationLink: "" 
    });
    setShowForm(true);
  }}
  className="px-4 py-2 bg-blue-600 text-white text-sm rounded"
>
  Add Branch
</button>

        <button
  onClick={handleReset}
  className="px-4 py-2 bg-blue-600 text-white text-sm rounded"
>
  Reset
</button>

        <span className="ml-auto text-red-600 text-sm font-medium">
          No of branches fetched is : {branches.length}
        </span>
      </div>

      {/* ================= ADD BRANCH FORM ================= */}
      {showForm && (
  <div className="border rounded bg-white p-6 mb-4">
    <div className="grid grid-cols-2 gap-6">

      {/* Branch Code */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Branch Code *
        </label>
        <input
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.branchCode}
  onChange={(e) =>
    setFormData({ ...formData, branchCode: e.target.value })
  }
/>
      </div>

      {/* Branch Name */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Branch Name *
        </label>
        <input
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.branchName}
  onChange={(e) =>
    setFormData({ ...formData, branchName: e.target.value })
  }
/>
      </div>

      {/* Email */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Email
        </label>
        <input
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.email}
  onChange={(e) =>
    setFormData({ ...formData, email: e.target.value })
  }
/>
      </div>

      {/* Branch Category */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Branch Category
        </label>
        <select
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.category}
  onChange={(e) =>
    setFormData({ ...formData, category: e.target.value })
  }
>
  <option value="">Select Category</option>
  <option value="Urban">Urban</option>
  <option value="Semi-Urban">Semi-Urban</option>
</select>
      </div>

      {/* Branch Type */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Branch Type *
        </label>
        <select
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.type}
  onChange={(e) =>
    setFormData({ ...formData, type: e.target.value })
  }
>
  <option value="">Select Type</option>
  <option value="HQ">HQ</option>
  <option value="Cluster">Cluster</option>
  <option value="Branch">Branch</option>
</select>
      </div>

      {/* Parent Branch */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Parent Branch
        </label>
        <select
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.parent}
  onChange={(e) =>
    setFormData({ ...formData, parent: e.target.value })
  }
>
  <option value="">Select Parent</option>
  <option value="Krishna Cluster">Krishna Cluster</option>
  <option value="Guntur Cluster">Guntur Cluster</option>
  <option value="Visakhapatnam Cluster">Visakhapatnam Cluster</option>
  <option value="West Godavari Cluster">West Godavari Cluster</option>
</select>
      </div>

      {/* Address */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Address
        </label>
        <input
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.address}
  onChange={(e) =>
    setFormData({ ...formData, address: e.target.value })
  }
/>
      </div>

      {/* Pincode */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Pincode
        </label>
        <input
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.pincode}
  onChange={(e) =>
    setFormData({ ...formData, pincode: e.target.value })
  }
/>
      </div>
    </div>

    {/* Location Link */}
<div>
  <label className="text-sm font-medium text-gray-700">
    Location Link
  </label>
  <input
    className="mt-1 w-full border rounded px-3 py-2"
    value={formData.locationLink}
    onChange={(e) =>
      setFormData({ ...formData, locationLink: e.target.value })
    }
    placeholder="Enter Google Maps link"
  />
</div>

    {/* ACTION BUTTONS */}
    <div className="mt-6 flex gap-4">
      <button
  onClick={handleSave}
  className="px-5 py-2 bg-blue-600 text-white rounded"
>
  Save
</button>

      <button
  onClick={handleDelete}
  disabled={selectedRows.length === 0}
  className={`px-5 py-2 rounded text-white ${
  selectedRows.length > 0
    ? "bg-red-500"
    : "bg-gray-400 cursor-not-allowed"
}`}
>
  Delete
</button>

      <button
        onClick={() => setShowForm(false)}
        className="text-blue-600"
      >
        Cancel
      </button>
    </div>
  </div>
)}

      {/* ================= TABLE ================= */}
      <div className="border rounded overflow-hidden bg-white">
        <div className="h-[420px] overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
  <tr>
    <th className="border px-3 py-2">
      <input
        type="checkbox"
        checked={selectAllCurrentPage}
        onChange={(e) => {
          const checked = e.target.checked;
          setSelectAllCurrentPage(checked);

          const currentPageIDs = currentRecords.map(b => b.branchCode);

          if (checked) {
            const newSelection = [
              ...new Set([...selectedRows, ...currentPageIDs])
            ];
            setSelectedRows(newSelection);
          } else {
            const newSelection = selectedRows.filter(
              id => !currentPageIDs.includes(id)
            );
            setSelectedRows(newSelection);
          }
        }}
      />
    </th>

    <th className="border px-3 py-2">S. No.</th>
    <th className="border px-3 py-2">Branch Code</th>
    <th className="border px-3 py-2">Branch Name</th>
    <th className="border px-3 py-2">Branch Email Id</th>
    <th className="border px-3 py-2">Status</th>
    <th className="border px-3 py-2">Location</th>
  </tr>
</thead>

            <tbody>
  {currentRecords.length === 0 ? (
    <tr>
      <td colSpan="7" className="text-center py-10 text-gray-500">
        No data found
      </td>
    </tr>
  ) : (
    currentRecords.map((b, index) => (
      <tr
  key={b.branchCode}
  className="hover:bg-gray-100 cursor-pointer"
  onClick={() => {
    setFormData({
      branchCode: b.branchCode,
      branchName: b.branchName,
      email: b.branchEmailId,
      category: b.branchCategory,
      type: b.branchType,
      parent: b.parentBranch,
      address: b.address,
      pincode: b.pincode,
      locationLink: b.location
    });
    setShowForm(true);
  }}
>
        
        {/* Checkbox */}
        <td className="border px-3 py-2 text-center">
          <input
            type="checkbox"
            checked={selectedRows.includes(b.branchCode)}
            onChange={() => handleRowSelect(b.branchCode)}
            onClick={(e) => e.stopPropagation()}
          />
        </td>

        {/* S. No. */}
        <td className="border px-3 py-2 text-center">
          {indexOfFirstRecord + index + 1}
        </td>

        {/* Branch Code */}
        <td className="border px-3 py-2">{b.branchCode}</td>

        {/* Branch Name */}
        <td className="border px-3 py-2">{b.branchName}</td>

        {/* Email */}
        <td className="border px-3 py-2">{b.branchEmailId}</td>

        {/* Status */}
        <td className="border px-3 py-2 text-green-600 font-medium">
  Active
</td>

        {/* Location */}
        <td className="border px-3 py-2 text-center">
  <button
  onClick={(e) => {
    e.stopPropagation();
    setSelectedLocation(b.location);
    setShowMapModal(true);
  }}
  className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
>
  Direction
</button>
</td>

      </tr>
    ))
  )}
</tbody>
          </table>
        </div>

        {showMapModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-[900px] p-6 shadow-lg">

      <h2 className="text-lg font-semibold mb-4">
        Capture Location
      </h2>

      {/* Google Map iframe */}
      <div className="w-full h-[400px]">
        <iframe
  src={selectedLocation}
  width="100%"
  height="100%"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  title="Branch Location Map"
></iframe>
      </div>

      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={() => setShowMapModal(false)}
          className="px-4 py-2 bg-gray-400 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

        {/* PAGINATION */}
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">

  {/* Select All Across Pages */}
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={(e) => {
        const checked = e.target.checked;
        setSelectAllAllPages(checked);

        if (checked) {
          const allIDs = branches.map(b => b.branchCode);
          setSelectedRows(allIDs);
          setSelectAllCurrentPage(true);
        } else {
          setSelectedRows([]);
          setSelectAllCurrentPage(false);
        }
      }}
    />
    <span>Select all records from all pages</span>
  </div>

  {/* Pagination Controls */}
  <div className="flex items-center gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() => {
        setCurrentPage(1);
        setSelectAllCurrentPage(false);
      }}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ⏮
    </button>

    <button
      disabled={currentPage === 1}
      onClick={() => {
        setCurrentPage(prev => prev - 1);
        setSelectAllCurrentPage(false);
      }}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ◀
    </button>

    <span>Page {currentPage} of {totalPages}</span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => {
        setCurrentPage(prev => prev + 1);
        setSelectAllCurrentPage(false);
      }}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ▶
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => {
        setCurrentPage(totalPages);
        setSelectAllCurrentPage(false);
      }}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ⏭
    </button>
  </div>
</div>
      </div>
    </div>
  );
};

export default Branch;
