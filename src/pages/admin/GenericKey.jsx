import { useState, useEffect } from "react";

const GenericKey = () => {
  const [showForm, setShowForm] = useState(false);

  const [filterDesc, setFilterDesc] = useState("");
  const [filterKey, setFilterKey] = useState("");

  const [records, setRecords] = useState([]);

  const [formData, setFormData] = useState({
    genericKey: "",
    description: "",
    validFrom: "",
    validTo: ""
  });

  /* ================= SEARCH ================= */
  const handleSearch = async () => {
    const res = await fetch(
      `/api/generic-keys?desc=${filterDesc}&key=${filterKey}`
    );
    const data = await res.json();
    setRecords(data);
  };

  /* ================= RESET ================= */
  const handleReset = async () => {
    setFilterDesc("");
    setFilterKey("");

    const res = await fetch("/api/generic-keys");
    const data = await res.json();
    setRecords(data);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    await fetch("/api/generic-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    setShowForm(false);
    setFormData({
      genericKey: "",
      description: "",
      validFrom: "",
      validTo: ""
    });
    handleReset();
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!formData.genericKey) {
      alert("Please select a record to delete");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this Generic Key?"
    );
    if (!confirmed) return;

    await fetch(`/api/generic-keys/${formData.genericKey}`, {
      method: "DELETE"
    });

    setShowForm(false);
    setFormData({
      genericKey: "",
      description: "",
      validFrom: "",
      validTo: ""
    });
    handleReset();
  };

  /* ================= LOAD ON PAGE OPEN ================= */
  useEffect(() => {
    handleReset();
  }, []);

  return (
    <div className="p-4 w-full">

      {/* ================= FILTER BAR ================= */}
      <div className="flex items-center gap-3 mb-3">
        <input
          placeholder="Filter by description..."
          value={filterDesc}
          onChange={(e) => setFilterDesc(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-64"
        />

        <input
          placeholder="Filter by Generic Key..."
          value={filterKey}
          onChange={(e) => setFilterKey(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-64"
        />

        <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded">
          Search
        </button>

        <button
          onClick={() => {
            setFormData({
              genericKey: "",
              description: "",
              validFrom: "",
              validTo: ""
            });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Generic Key
        </button>

        <button onClick={handleReset} className="px-4 py-2 bg-blue-600 text-white rounded">
          Reset
        </button>

        <button
  onClick={handleDelete}
  disabled={!formData.productId}
  className={`px-4 py-2 text-sm rounded text-white ${
    formData.productId
      ? "bg-red-600"
      : "bg-gray-400 cursor-not-allowed"
  }`}
>
  Delete
</button>

        <span className="ml-auto text-red-600 text-sm font-medium">
          No of records fetched is : {records.length}
        </span>
      </div>

      {/* ================= ADD / EDIT FORM ================= */}
      {showForm && (
        <div className="border rounded bg-white p-6 mb-4">
          <div className="grid grid-cols-2 gap-6">

            <div>
              <label className="text-sm font-medium">Generic Key *</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.genericKey}
                onChange={(e) =>
                  setFormData({ ...formData, genericKey: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Valid From *</label>
              <input
                type="date"
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Valid To *</label>
              <input
                type="date"
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.validTo}
                onChange={(e) =>
                  setFormData({ ...formData, validTo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded">
              Save
            </button>

            <button
  onClick={handleDelete}
  disabled={!formData.genericKey}
  className={`px-5 py-2 rounded text-white ${
    formData.genericKey ? "bg-red-500" : "bg-gray-400 cursor-not-allowed"
  }`}
>
  Delete
</button>

            <button onClick={() => setShowForm(false)} className="text-blue-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="border rounded bg-white overflow-hidden">
        <div className="h-[420px] overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                <th className="border px-3 py-2"></th>
                <th className="border px-3 py-2">Generic Key</th>
                <th className="border px-3 py-2">Description</th>
                <th className="border px-3 py-2">Valid From</th>
                <th className="border px-3 py-2">Valid To</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
  key={r.genericKey}
  onClick={() => {
    setFormData(r);
    setShowForm(true);
  }}
  className="cursor-pointer hover:bg-gray-100"
>
                    <td className="border px-3 py-2"></td>
                    <td className="border px-3 py-2">{r.genericKey}</td>
                    <td className="border px-3 py-2">{r.description}</td>
                    <td className="border px-3 py-2">{r.validFrom}</td>
                    <td className="border px-3 py-2">{r.validTo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GenericKey;
