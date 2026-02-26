import { useState, useEffect } from "react";

const Product = () => {
  const [showForm, setShowForm] = useState(false);

  // 🔍 Filters
  const [filterName, setFilterName] = useState("");
  const [filterCode, setFilterCode] = useState("");

  // 📊 Table data
  const [products, setProducts] = useState([]);
  // ✅ Checkbox selection state
const [selectedIds, setSelectedIds] = useState([]);
const [selectAllPages, setSelectAllPages] = useState(false);
const [isEditMode, setIsEditMode] = useState(false);

const RECORDS_PER_PAGE = 15;

const [currentPage, setCurrentPage] = useState(1);

const totalPages = Math.ceil(products.length / RECORDS_PER_PAGE);

const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
const endIndex = startIndex + RECORDS_PER_PAGE;

const currentPageData = products.slice(startIndex, endIndex);

  // 📝 Form data
  const [formData, setFormData] = useState({
    productCategory: "",
    productType: "",
    productCode: "",
    productName: "",
    maxTenure: "",
    minTenure: "",
    maxLimit: "",
    minLimit: "",
    validFrom: "",
  validTo: ""
  });

  /* ================= SEARCH ================= */
  const handleSearch = async () => {
    const res = await fetch(
  `http://40.80.79.26:5001/api/product-master?name=${filterName}&code=${filterCode}`
);
    const data = await res.json();
    setProducts(data);

    setSelectedIds([]);
setSelectAllPages(false);
setCurrentPage(1);
  };

  /* ================= RESET ================= */
  const handleReset = async () => {
    setFilterName("");
    setFilterCode("");

    const res = await fetch("http://40.80.79.26:5001/api/product-master");
    const data = await res.json();
    setProducts(data);

    setSelectedIds([]);
setSelectAllPages(false);
setCurrentPage(1);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {

  const method = isEditMode ? "PUT" : "POST";

  const url = isEditMode
    ? `http://40.80.79.26:5001/api/product-master/${formData.productCode}`
    : "http://40.80.79.26:5001/api/product-master";

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  setShowForm(false);
  setIsEditMode(false);  // reset edit mode

  setFormData({
    productCategory: "",
    productType: "",
    productCode: "",
    productName: "",
    maxTenure: "",
    minTenure: "",
    maxLimit: "",
    minLimit: "",
    validFrom: "",
    validTo: ""
  });

  handleReset();
};

  /* ================= DELETE ================= */
  const handleDelete = async () => {

  if (selectedIds.length === 0) {
    alert("Select products to delete");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to delete selected products?"
  );
  if (!confirmed) return;

  for (let code of selectedIds) {
    await fetch(`http://40.80.79.26:5001/api/product-master/${code}`, {
      method: "DELETE"
    });
  }

  setProducts(prev =>
    prev.filter(p => !selectedIds.includes(p.ProductCode))
  );

  setSelectedIds([]);
  setSelectAllPages(false);
};

  /* ================= LOAD ON PAGE OPEN ================= */
  useEffect(() => {
    handleReset();
  }, []);

const handleSelectAllCurrentPage = (checked) => {
  if (checked) {
    const currentPageIds = currentPageData.map(p => p.ProductCode);
    setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
  } else {
    const currentPageIds = currentPageData.map(p => p.ProductCode);
    setSelectedIds(prev =>
      prev.filter(id => !currentPageIds.includes(id))
    );
    setSelectAllPages(false);
  }
};

  return (
    <div className="p-4 w-full">

      {/* ================= FILTER BAR ================= */}
      <div className="flex items-center gap-3 mb-3">
        <input
          placeholder="Filter by Product Name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-64"
        />

        <input
          placeholder="Filter by Product Code..."
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-56"
        />

        <button onClick={handleSearch} className="px-4 py-2 bg-blue-600 text-white rounded">
          Search
        </button>

        <button
          onClick={() => {
            setFormData({
              productCategory: "",
              productType: "",
              productCode: "",
              productName: "",
              maxTenure: "",
              minTenure: "",
              maxLimit: "",
              minLimit: "",
              validFrom: "",
validTo: ""
            });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Product
        </button>

        <button onClick={handleReset} className="px-4 py-2 bg-blue-600 text-white rounded">
          Reset
        </button>

        <button
  onClick={handleDelete}
  disabled={selectedIds.length === 0}
  className={`px-4 py-2 text-sm rounded text-white ${
    selectedIds.length > 0
      ? "bg-red-600"
      : "bg-gray-400 cursor-not-allowed"
  }`}
>
  Delete
</button>

        <span className="ml-auto text-red-600 text-sm font-medium">
          No of products fetched is : {products.length}
        </span>
      </div>

      {/* ================= ADD / EDIT FORM ================= */}
      {showForm && (
        <div className="border rounded bg-white p-6 mb-4">
          <div className="grid grid-cols-2 gap-6">

            <div>
              <label>Product Category</label>
              <select
  className="mt-1 w-full border rounded px-3 py-2"
  value={formData.productCategory}
  onChange={(e) =>
    setFormData({ ...formData, productCategory: e.target.value })
  }
>
  <option value="">Select Category</option>
  <option value="Loans">Loans</option>
  <option value="Deposits">Deposits</option>
</select>
            </div>

            <div>
              <label>Product Type</label>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.productType}
                onChange={(e) =>
                  setFormData({ ...formData, productType: e.target.value })
                }
              >
                <option value="">Select Type</option>
              </select>
            </div>

            <div>
              <label>Product Code *</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.productCode}
                onChange={(e) =>
                  setFormData({ ...formData, productCode: e.target.value })
                }
              />
            </div>

            <div>
              <label>Product Name *</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.productName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, productName: e.target.value })
                }
              />
            </div>

            <div>
              <label>Max Tenure</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.maxTenure}
                onChange={(e) =>
                  setFormData({ ...formData, maxTenure: e.target.value })
                }
              />
            </div>

            <div>
              <label>Min Tenure</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.minTenure}
                onChange={(e) =>
                  setFormData({ ...formData, minTenure: e.target.value })
                }
              />
            </div>

            <div>
              <label>Max Limit</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.maxLimit}
                onChange={(e) =>
                  setFormData({ ...formData, maxLimit: e.target.value })
                }
              />
            </div>

            <div>
              <label>Min Limit</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={formData.minLimit}
                onChange={(e) =>
                  setFormData({ ...formData, minLimit: e.target.value })
                }
              />
            </div>
            <div>
  <label>Valid From</label>
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
  <label>Valid To</label>
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
  disabled={selectedIds.length === 0}
  className={`px-4 py-2 text-sm rounded text-white ${
    selectedIds.length > 0
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
    {/* Checkbox */}
    <th className="border px-3 py-2">
      <input
        type="checkbox"
        checked={
  products.length > 0 &&
  currentPageData.length > 0 &&
currentPageData.every(p => selectedIds.includes(p.ProductCode))
}
        onChange={(e) =>
          handleSelectAllCurrentPage(e.target.checked)
        }
      />
    </th>

    {/* S.No */}
    <th className="border px-3 py-2">S. No.</th>

    <th className="border px-3 py-2">Product Category</th>
    <th className="border px-3 py-2">Product Code</th>
    <th className="border px-3 py-2">Product Name</th>
    <th className="border px-3 py-2">Valid From</th>
    <th className="border px-3 py-2">Valid To</th>
    <th className="border px-3 py-2">Status</th>
  </tr>
</thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                currentPageData.map((p, index) => (
  <tr key={p.SNo || p.ProductCode || index} className="hover:bg-gray-100">

    {/* Row Checkbox */}
    <td className="border px-3 py-2 text-center">
      <input
        type="checkbox"
        checked={selectedIds.includes(p.ProductCode)}
        onChange={(e) => {
          if (e.target.checked) {
  setSelectedIds(prev => [...new Set([...prev, p.ProductCode])]);
} else {
            setSelectedIds(
              selectedIds.filter(id => id !== p.ProductCode)
            );
            setSelectAllPages(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </td>

    {/* S.No */}
    <td className="border px-3 py-2">
      {startIndex + index + 1}
    </td>

    <td
      className="border px-3 py-2 cursor-pointer"
      onClick={() => {
  setFormData({
  productCategory: p.ProductCategory || "",
  productType: p.ProductType || "",
  productCode: p.ProductCode || "",
  productName: p.ProductName || "",
  maxTenure: p.MaxTenure ?? "",
  minTenure: p.MinTenure ?? "",
  maxLimit: p.MaxLimit ?? "",
  minLimit: p.MinLimit ?? "",
  validFrom: p.ValidFrom ? p.ValidFrom.split("T")[0] : "",
  validTo: p.ValidTo ? p.ValidTo.split("T")[0] : ""
});
setIsEditMode(true);
  setShowForm(true);
}}
    >
      {p.ProductCategory}
    </td>

    <td className="border px-3 py-2">{p.ProductCode}</td>
    <td className="border px-3 py-2">{p.ProductName}</td>
    <td className="border px-3 py-2">
  {p.ValidFrom
    ? new Date(p.ValidFrom)
        .toLocaleDateString("en-GB")
        .replaceAll("/", "-")
    : ""}
</td>

<td className="border px-3 py-2">
  {p.ValidTo
    ? new Date(p.ValidTo)
        .toLocaleDateString("en-GB")
        .replaceAll("/", "-")
    : ""}
</td>
    <td className="border px-3 py-2">
  <span
    className={`font-medium ${
      (p.Status || "Active") === "Active"
        ? "text-green-600"
        : "text-red-600"
    }`}
  >
    {p.Status || "Active"}
  </span>
</td>
  </tr>
))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
<div className="flex items-center justify-between mt-4 text-sm text-slate-600">

  {/* Select All Pages */}
  {selectedIds.length > 0 && (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectAllPages}
        onChange={(e) => {
          const checked = e.target.checked;
          setSelectAllPages(checked);

          if (checked) {
            const allIds = products.map(p => p.ProductCode);
            setSelectedIds(allIds);
          } else {
            setSelectedIds([]);
          }
        }}
      />
      <span>Select all records from all pages</span>
    </div>
  )}

  {/* Page Controls */}
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

    <span>Page {currentPage} of {totalPages}</span>

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
      </div>
    </div>
  );
};

export default Product;
