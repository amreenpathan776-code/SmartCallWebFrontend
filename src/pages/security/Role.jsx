import { useState, useEffect, useCallback } from "react";

const BASE_URL = "https://mobile.coastal.bank.in:5001";

const RECORDS_PER_PAGE = 15;
const hiddenRoleIds = [7, 8, 9, 10];

const Role = () => {
  const [roles, setRoles] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterName, setFilterName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectAllCurrentPage, setSelectAllCurrentPage] = useState(false);
  const [selectAllAllPages, setSelectAllAllPages] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    roleName: "",
    validFrom: "",
    validTo: ""
  });

  /* ================= LOAD ROLES ================= */
  const loadRoles = useCallback(async () => {
  const res = await fetch(`${BASE_URL}/api/roles/list`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: filterName,
    page: currentPage
  })
});

  const data = await res.json();

  setRoles(data.records);
  const filteredRoles = data.records.filter(
  (r) => !hiddenRoleIds.includes(r.RoleId)
);

setRoles(data.records); // keep original (important)
setTotalRecords(filteredRoles.length);
}, [filterName, currentPage]);

  useEffect(() => {
  loadRoles();
}, [loadRoles]);

  /* ================= SEARCH ================= */
  const handleSearch = () => {
    setCurrentPage(1);
    loadRoles();
  };

  /* ================= ADD ROLE ================= */
  const handleSaveRole = async () => {

  if (!formData.roleName.trim()) {
    alert("Role is required");
    return;
  }

  const method = editingId ? "PUT" : "POST";
  const url = editingId
    ? `${BASE_URL}/api/roles/${editingId}`
    : `${BASE_URL}/api/roles`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  setShowForm(false);
  setEditingId(null);
  setFormData({ roleName: "", validFrom: "", validTo: "" });

  loadRoles(); // 🔥 refresh table
};
  /* ================= DELETE ROLE ================= */
  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm("Are you sure?");
    if (!confirmed) return;

    await fetch(`${BASE_URL}/api/roles/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds })
    });

    setSelectedIds([]);
    loadRoles();
  };

  const toggleCheckbox = (id) => {
  setSelectedIds((prev) => {
    let updated;

    if (prev.includes(id)) {
      updated = prev.filter((x) => x !== id);
    } else {
      updated = [...prev, id];
    }

    setSelectAllCurrentPage(
      roles
  .filter((r) => !hiddenRoleIds.includes(r.RoleId))
  .every((r) => updated.includes(r.RoleId))
    );

    return updated;
  });

  setSelectAllAllPages(false);
};

  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  return (
    <div className="bg-white rounded-xl border p-6">

      {/* ================= FILTER BAR ================= */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Filter by name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="border rounded px-3 py-2 w-56"
        />

        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Search
        </button>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-slate-100 rounded"
        >
          Add Role
        </button>

        <button
          onClick={handleDelete}
          disabled={selectedIds.length === 0}
          className={`px-4 py-2 rounded ${
            selectedIds.length
              ? "bg-red-600 text-white"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Delete Role
        </button>

        <span className="ml-auto text-sm text-slate-600">
          No of records fetched is : {totalRecords}
        </span>
      </div>

      {/* ================= ADD ROLE FORM ================= */}
      {showForm && (
        <div className="border rounded-xl p-6 mb-6 bg-slate-50">

          <div className="grid grid-cols-2 gap-6">

            <div>
              <label className="block text-sm font-medium mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.roleName}
                onChange={(e) =>
                  setFormData({ ...formData, roleName: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Valid From
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Valid To
              </label>
              <input
                type="date"
                value={formData.validTo}
                onChange={(e) =>
                  setFormData({ ...formData, validTo: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSaveRole}
              className="px-6 py-2 bg-blue-600 text-white rounded"
            >
              Save
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
<div className="flex justify-center">
  <div className="w-[75%]">

    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
  <tr>

    {/* Header Checkbox */}
    <th className="p-2 border text-center">
      <input
        type="checkbox"
        checked={selectAllCurrentPage}
        onChange={(e) => {
          const checked = e.target.checked;
          setSelectAllCurrentPage(checked);
          setSelectAllAllPages(false);

          if (checked) {
            const pageIds = roles
  .filter((r) => !hiddenRoleIds.includes(r.RoleId))
  .map(r => r.RoleId);
            setSelectedIds(pageIds);
          } else {
            setSelectedIds([]);
          }
        }}
      />
    </th>

    <th className="p-2 border text-center">S.No</th>
    <th className="p-2 border">Role</th>
    <th className="p-2 border text-center">Valid From</th>
    <th className="p-2 border text-center">Valid To</th>

  </tr>
</thead>

        <tbody>
          {roles.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center p-6 text-slate-400">
                No data found
              </td>
            </tr>
          ) : (
            roles
  .filter((r) => !hiddenRoleIds.includes(r.RoleId))
  .map((r, index) => (
              <tr
  key={r.RoleId}
  className="hover:bg-slate-100 cursor-pointer"
  onClick={() => {
    setEditingId(r.RoleId);
    setFormData({
      roleName: r.RoleName,
      validFrom: r.ValidFrom ? r.ValidFrom.split("T")[0] : "",
      validTo: r.ValidTo ? r.ValidTo.split("T")[0] : ""
    });
    setShowForm(true);
  }}
>

  {/* Checkbox First */}
  <td className="border p-2 text-center">
  <input
    type="checkbox"
    checked={selectedIds.includes(r.RoleId)}
    onClick={(e) => e.stopPropagation()}   // ✅ ADD THIS
    onChange={() => toggleCheckbox(r.RoleId)}
  />
</td>

  {/* Serial Number Second */}
  <td className="border p-2 text-center">
    {index + 1}
  </td>

  <td className="border p-2">{r.RoleName}</td>

  <td className="border p-2 text-center">
    {r.ValidFrom
      ? new Date(r.ValidFrom).toLocaleDateString("en-GB")
      : ""}
  </td>

  <td className="border p-2 text-center">
    {r.ValidTo
      ? new Date(r.ValidTo).toLocaleDateString("en-GB")
      : ""}
  </td>

</tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Pagination & Select All */}
<div className="flex items-center justify-between mt-4 text-sm text-slate-600">

  {/* Select All From All Pages */}
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={selectAllAllPages}
      onChange={async (e) => {
        const checked = e.target.checked;
        setSelectAllAllPages(checked);
        setSelectAllCurrentPage(false);

        if (checked) {
          // Fetch ALL role IDs from backend
          const res = await fetch(`${BASE_URL}/api/roles/list`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: filterName,
    fetchAll: true
  })
});
          const data = await res.json();

          const allIds = data.records.map(r => r.RoleId);
          setSelectedIds(allIds);
        } else {
          setSelectedIds([]);
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

    </div>
  );
};

export default Role;