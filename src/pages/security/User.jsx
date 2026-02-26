import { useState, useEffect, useCallback } from "react";

const User = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters
  const [filterName, setFilterName] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [branches, setBranches] = useState([]);
  const [rolesList, setRolesList] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);
const [selectAllCurrentPage, setSelectAllCurrentPage] = useState(false);
const [selectAllAllPages, setSelectAllAllPages] = useState(false);
const [totalRecords, setTotalRecords] = useState(0);
  

  // Form Data
const [formData, setFormData] = useState({
  userId: "",
  userName: "",
  branchId: "",
  roles: [], 
  dateOfBirth: "",
  mobile: "",
  validFrom: "",
  validUntil: ""
});

useEffect(() => {
  loadBranches();
  loadUsers(1);
  loadRoles(); 
}, []);

  /* ================= LOAD USERS ================= */
const loadUsers = async (page = 1) => {
  const res = await fetch(
    "http://40.80.79.26:5001/api/users/list",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page,
        pageSize: 15,
        name: "",
        branch: ""
      })
    }
  );

  const data = await res.json();
  setUsers(data.records || []);
  setTotalPages(data.pages || 1);
  setCurrentPage(data.page || 1);
  setTotalRecords(data.totalRecords || 0); 
};

const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

/* ================= LOAD BRANCHES ================= */
const loadBranches = async () => {
  const res = await fetch("http://40.80.79.26:5001/api/branches");
  const data = await res.json();
  
  const mapped = data.map(b => ({
    branchId: b.branch_code,
    branchName: b.branch_name
  }));

  console.log("BRANCHES LOADED:", mapped);
  setBranches(mapped);
};

const loadRoles = async () => {
  const res = await fetch(
    "http://40.80.79.26:5001/api/roles/list",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    }
  );

  const data = await res.json();
  setRolesList(data.records || []);
};

  /* ================= SEARCH ================= */
  const handleSearch = useCallback(async (page = 1) => {
  const res = await fetch(
    "http://40.80.79.26:5001/api/users/list",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page,
        pageSize: 15,
        name: filterName,
        branch: filterBranch
      })
    }
  );

  const data = await res.json();
  setUsers(data.records || []);
  setTotalPages(data.pages || 1);
  setCurrentPage(data.page || 1);
  setTotalRecords(data.totalRecords || 0);
}, [filterName, filterBranch]);

  /* ================= RESET ================= */
  const handleReset = async () => {
  setFilterName("");
  setFilterBranch("");
  setCurrentPage(1);
  loadUsers(1);
};

  /* ================= SAVE ================= */
  const handleSave = async () => {
  const selectedBranch = branches.find(
  b => String(b.branchId) === String(formData.branchId)
);

const payload = {
  userId: formData.userId,
  userName: formData.userName,
  branchName: selectedBranch?.branchName || formData.branchName || null,
  roles: formData.roles,
  mobileNumber: formData.mobile,
  dateOfBirth: formData.dateOfBirth !== "" ? formData.dateOfBirth : null,
  validFrom: formData.validFrom !== "" ? formData.validFrom : null,
  validUntil: formData.validUntil !== "" ? formData.validUntil : null
};

  const method = selectedUser ? "PUT" : "POST";
  const url = selectedUser
    ? `http://40.80.79.26:5001/api/users/${selectedUser.userId}`
    : `http://40.80.79.26:5001/api/users`;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  alert(data.message);

  setShowForm(false);
  setSelectedUser(null);
  loadUsers(1);
};

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!selectedUser) return;

    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    await fetch(`http://40.80.79.26:5001/api/users/${selectedUser.userId}`, {
  method: "DELETE"
});

    setSelectedUser(null);
    setShowForm(false);
    loadUsers();
  };

  return (
    <div className="bg-white rounded-xl border p-6">

      {/* ================= FILTER BAR ================= */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by User Name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="border rounded px-3 py-2 w-56"
        />

        <select
  value={filterBranch}
  onChange={(e) => setFilterBranch(e.target.value)}
  className="border rounded px-3 py-2 w-56 text-black bg-white"
>
  <option value="">Filter by Branch...</option>
  {branches.map((b) => (
    <option key={b.branchId} value={b.branchName}>
      {b.branchName}
    </option>
  ))}
</select>

        <button onClick={() => handleSearch(1)} className="px-4 py-2 bg-primary text-white rounded">
  Search
</button>

<button
  onClick={() => {
    setSelectedUser(null);
    setFormData({
      userId: "",
      userName: "",
      branchId: "",
      roles: [],
      dateOfBirth: "",
      mobile: "",
      validFrom: "",
      validUntil: ""
    });
    setShowForm(true);
  }}
  className="px-4 py-2 bg-slate-100 rounded"
>
  Add User
</button>


        <button onClick={handleReset} className="px-4 py-2 bg-slate-100 rounded">
          Reset
        </button>

        <button
          onClick={handleDelete}
          disabled={!selectedUser}
          className={`px-4 py-2 rounded ${
            selectedUser ? "bg-red-600 text-white" : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Delete User
        </button>

        <span className="ml-auto text-sm text-slate-600">
          No of total records is : {totalRecords}
        </span>
      </div>

      {/* ================= ADD / EDIT FORM ================= */}
      {showForm && (
  <div className="border rounded bg-white p-6 mb-4">
    <div className="grid grid-cols-2 gap-6">

      {/* User Id */}
      <div>
        <label className="text-sm font-medium">User Id *</label>
        <input
  value={formData.userId}
  onChange={(e) => !selectedUser && setFormData({ ...formData, userId: e.target.value })}
  disabled={!!selectedUser}
  className={`mt-1 w-full border rounded px-3 py-2 ${
    selectedUser ? "bg-gray-200 cursor-not-allowed" : ""
  }`}
/>
      </div>

      {/* User Name */}
      <div>
        <label className="text-sm font-medium">User Name *</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2"
          value={formData.userName}
          onChange={(e) =>
            setFormData({ ...formData, userName: e.target.value })
          }
        />
      </div>

      {/* Branch */}
      <div>
        <label className="text-sm font-medium">Branch *</label>
        <select
  className="mt-1 w-full border rounded px-3 py-2 text-black bg-white"
  value={formData.branchId}
  onChange={(e) =>
    setFormData({ ...formData, branchId: e.target.value })
  }
>
  <option value="">Select Branch</option>
  {branches.map((b, index) => (
  <option key={index} value={b.branchId || b.branch_code}>
    {b.branchName || b.branch_name}
  </option>
))}
</select>
      </div>

      {/* Date of Birth */}
      <div>
        <label className="text-sm font-medium">Date of Birth *</label>
        <input
          type="date"
          className="mt-1 w-full border rounded px-3 py-2"
          value={formData.dateOfBirth}
          onChange={(e) =>
            setFormData({ ...formData, dateOfBirth: e.target.value })
          }
        />
      </div>

      {/* Mobile */}
      <div>
  <label className="text-sm font-medium">Mobile Number *</label>
  <div className="flex items-center border rounded px-3 py-2">
    <span className="mr-2">+91</span>
    <input
      type="text"
      maxLength={10}
      pattern="[0-9]{10}"
      value={formData.mobile}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, '');
        if (v.length <= 10) setFormData({ ...formData, mobile: v });
      }}
      className="flex-1 outline-none"
    />
  </div>
</div>

      {/* Valid From */}
      <div>
        <label className="text-sm font-medium">Valid From</label>
        <input
          type="date"
          className="mt-1 w-full border rounded px-3 py-2"
          value={formData.validFrom}
          onChange={(e) =>
            setFormData({ ...formData, validFrom: e.target.value })
          }
        />
      </div>

      {/* Valid Until */}
      <div>
        <label className="text-sm font-medium">Valid Until</label>
        <input
          type="date"
          className="mt-1 w-full border rounded px-3 py-2"
          value={formData.validUntil}
          onChange={(e) =>
            setFormData({ ...formData, validUntil: e.target.value })
          }
        />
      </div>
    </div>

    {/* ================= DESCRIPTION / ROLES ================= */}
<div className="mt-6 border rounded">
  <div className="bg-slate-100 px-4 py-2 font-medium">
    Description
  </div>

  <div className="p-4">
    <label className="text-sm font-medium">Role *</label>
    <div className="mt-2 border rounded p-3 max-h-40 overflow-y-auto">
  {rolesList.map((r) => (
    <div key={r.RoleId} className="flex items-center gap-2 mb-2">
      <input
        type="checkbox"
        checked={formData.roles.includes(r.RoleId)}
        onChange={(e) => {
          if (e.target.checked) {
            setFormData({
              ...formData,
              roles: [...formData.roles, r.RoleId]
            });
          } else {
            setFormData({
              ...formData,
              roles: formData.roles.filter(id => id !== r.RoleId)
            });
          }
        }}
      />
      <label>{r.RoleName}</label>
    </div>
  ))}
</div>
  </div>
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
        onClick={() => setShowForm(false)}
        className="text-blue-600"
      >
        Cancel
      </button>
    </div>
  </div>
)}

      {/* ================= TABLE ================= */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
  <tr>
    {/* Header Checkbox */}
    <th className="p-3 border text-center">
      <input
        type="checkbox"
        checked={selectAllCurrentPage}
        onChange={(e) => {
          const checked = e.target.checked;
          setSelectAllCurrentPage(checked);
          setSelectAllAllPages(false);

          if (checked) {
            const pageIds = users.map(u => u.userId);
            setSelectedIds(pageIds);
          } else {
            setSelectedIds([]);
          }
        }}
      />
    </th>

    {/* S.No */}
    <th className="p-3 border">S. No</th>

    <th className="p-3 border">User Id</th>
    <th className="p-3 border">User Name</th>
    <th className="p-3 border">Branch</th>
    <th className="p-3 border">Status</th>
    <th className="p-3 border">Role</th>
  </tr>
</thead>

          <tbody>
  {users.length === 0 ? (
    <tr>
      <td colSpan="7" className="text-center p-10 text-slate-400">
        No data found
      </td>
    </tr>
  ) : (
    users.map((u, index) => {

      const serialNumber = (currentPage - 1) * 15 + index + 1;

      return (
        <tr
  key={u.userId}
  onClick={() => {
    const branch = branches.find(b => b.branchName === u.branchName);

    setSelectedUser(u);
    setFormData({
      userId: u.userId,
      userName: u.userName,
      branchId: branch?.branchId || "",
      branchName: u.branchName,
      roles: u.roleIds
  ? u.roleIds.split(",").map(Number)
  : [],
      dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split("T")[0] : "",
      mobile: u.mobileNumber || "",
      validFrom: u.validFrom ? u.validFrom.split("T")[0] : "",
      validUntil: u.validUntil ? u.validUntil.split("T")[0] : ""
    });

    setShowForm(true);
  }}
  className="cursor-pointer hover:bg-slate-100"
>
          {/* Row Checkbox */}
          <td className="border p-2 text-center">
            <input
              type="checkbox"
              checked={selectedIds.includes(u.userId)}
              onChange={(e) => {
                const checked = e.target.checked;

                if (checked) {
                  setSelectedIds(prev => [...prev, u.userId]);
                } else {
                  setSelectedIds(prev =>
                    prev.filter(id => id !== u.userId)
                  );
                  setSelectAllCurrentPage(false);
                  setSelectAllAllPages(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </td>

          {/* S.No */}
          <td className="border p-2">{serialNumber}</td>

          <td className="border p-2">{u.userId}</td>
          <td className="border p-2">{u.userName}</td>
          <td className="border p-2">{u.branchName}</td>
          <td className="border p-2">{u.status}</td>
          <td className="border p-2">{u.role}</td>
        </tr>
      );
    })
  )}
</tbody>
        </table>

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
          const res = await fetch(
            "http://40.80.79.26:5001/api/users/list",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                page: 1,
                pageSize: 999999,
                name: filterName,
                branch: filterBranch
              })
            }
          );

          const data = await res.json();
          const allIds = data.records.map(r => r.userId);
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
        if (filterName || filterBranch)
          handleSearch(1);
        else
          loadUsers(1);

        setSelectAllCurrentPage(false);
      }}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ⏮
    </button>

    <button
      disabled={currentPage === 1}
      onClick={() => {
        if (filterName || filterBranch)
          handleSearch(currentPage - 1);
        else
          loadUsers(currentPage - 1);

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
        if (filterName || filterBranch)
          handleSearch(currentPage + 1);
        else
          loadUsers(currentPage + 1);

        setSelectAllCurrentPage(false);
      }}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ▶
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => {
        if (filterName || filterBranch)
          handleSearch(totalPages);
        else
          loadUsers(totalPages);

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

export default User;