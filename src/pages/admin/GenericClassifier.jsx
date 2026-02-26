import { useState, useEffect } from "react";

const GenericClassifier = () => {
  const [showForm, setShowForm] = useState(false);

  const [filterName, setFilterName] = useState("");
  const [filterGenericKey, setFilterGenericKey] = useState("");

  const [records, setRecords] = useState([]);

  const [formData, setFormData] = useState({
    classifierId: "",
    description: "",
    genericKey: "",
    parentKey: "",
    validFrom: "",
    validUntil: ""
  });

  /* ================= SEARCH ================= */
  const handleSearch = async () => {
    const res = await fetch(
      `/api/generic-classifiers?name=${filterName}&key=${filterGenericKey}`
    );
    const data = await res.json();
    setRecords(data);
  };

  /* ================= RESET ================= */
  const handleReset = async () => {
    setFilterName("");
    setFilterGenericKey("");

    const res = await fetch("/api/generic-classifiers");
    const data = await res.json();
    setRecords(data);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
  const method = formData.classifierId ? "PUT" : "POST";
  const url = formData.classifierId
    ? `/api/generic-classifiers/${formData.classifierId}`
    : "/api/generic-classifiers";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  setShowForm(false);
  setFormData({
    classifierId: "",
    description: "",
    genericKey: "",
    parentKey: "",
    validFrom: "",
    validUntil: ""
  });
  handleReset();
};

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!formData.classifierId) {
  alert("Please select a record to delete");
  return;
}

    const confirmed = window.confirm(
      "Are you sure you want to delete this Generic Classifier?"
    );
    if (!confirmed) return;

    await fetch(`/api/generic-classifiers/${formData.classifierId}`, {
  method: "DELETE"
});

    setShowForm(false);
    setFormData({
  classifierId: "",
  description: "",
  genericKey: "",
  parentKey: "",
  validFrom: "",
  validUntil: ""
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
          placeholder="Filter by name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-64"
        />

        <select
          value={filterGenericKey}
          onChange={(e) => setFilterGenericKey(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-56"
        >
          <option value="">Filter by generic key...</option>
        </select>

        <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded">
          Search
        </button>

        <button
          onClick={() => {
            setFormData({
  classifierId: "",
  description: "",
  genericKey: "",
  parentKey: "",
  validFrom: "",
  validUntil: ""
});
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Generic Classifier
        </button>

        <button onClick={handleReset} className="px-4 py-2 bg-blue-600 text-white rounded">
          Reset
        </button>

        <button
  onClick={handleDelete}
  disabled={!formData.classifierId}
  className={`px-4 py-2 text-sm rounded text-white ${
    formData.classifierId
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
          <div className="grid grid-cols-3 gap-6">

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
              <label className="text-sm font-medium">Generic Key *</label>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.genericKey}
                onChange={(e) =>
                  setFormData({ ...formData, genericKey: e.target.value })
                }
              >
                <option value="">Select Generic Key</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Parent Key</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.parentKey}
                onChange={(e) =>
                  setFormData({ ...formData, parentKey: e.target.value })
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
              <label className="text-sm font-medium">Valid Until *</label>
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

          <div className="mt-6 flex gap-4">
            <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded">
              Save
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
                <th className="border px-3 py-2">Description</th>
                <th className="border px-3 py-2">Generic Key Description</th>
                <th className="border px-3 py-2">Parent Key Str</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
  key={r.classifierId}
  onClick={() => {
    setFormData(r);
    setShowForm(true);
  }}
  className="cursor-pointer hover:bg-gray-100"
>
                    <td className="border px-3 py-2"></td>
                    <td className="border px-3 py-2">{r.description}</td>
                    <td className="border px-3 py-2">{r.genericKeyDesc}</td>
                    <td className="border px-3 py-2">{r.parentKey}</td>
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

export default GenericClassifier;
