import { useState, useEffect } from "react";

// ✅ Logger
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

const SMAList = () => {

  const [filters, setFilters] = useState({
  mobileNumber: "",
  cluster: "",
  branch: "",
  accountNumber: "",
  customerName: "",
  dataType: "",   // ✅ NEW FILTER
  product: "",
  productGroup: "",
  loanType: "",
  newIrac: ""
});

  const [clusters, setClusters] = useState([]);
const [branches, setBranches] = useState([]);
const [products, setProducts] = useState([]);
const [productGroups, setProductGroups] = useState([]);
const [loanTypes, setLoanTypes] = useState([]);
const [newIracOptions, setNewIracOptions] = useState([]);

  const [records, setRecords] = useState([]);
  const [recordCount, setRecordCount] = useState(0);

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAllCurrentPage, setSelectAllCurrentPage] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [viewDetailsData, setViewDetailsData] = useState(null);

  const role = localStorage.getItem("role");
  logInfo("User role fetched", role);

let userCluster = "";

if (role?.startsWith("Regional Manager")) {

  const match = role.match(/\((.*?)\)/);
  const clusterName = match ? match[1] : "";

  const CLUSTER_CODE_MAP = {
    "Krishna": "KR",
    "Guntur": "GU",
    "West Godavari": "WG",
    "Visakhapatnam": "VS"
  };

  userCluster = CLUSTER_CODE_MAP[clusterName] || "";

}

const isBranchManager = role === "Branch Manager";
if (isBranchManager) {
  logWarn("Access restricted for Branch Manager");
}
const isRegionalManager = role?.includes("Regional Manager");

  const formatExcelDate = (excelDate) => {

  if (!excelDate) return "";

  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);

  return jsDate.toLocaleDateString("en-GB");
};

  const [currentPage, setCurrentPage] = useState(1);
const recordsPerPage = 15;

  const handleSearch = async () => {
    logInfo("Search triggered", filters);

  const searchFilters = {
    ...filters,
    cluster: isRegionalManager ? userCluster : filters.cluster
  };

  const hasFilter = Object.values(searchFilters).some(
    value => value !== ""
  );
  logInfo("Checking filters applied", searchFilters);

  if (!hasFilter) {
  logWarn("Search attempted without filters");
    alert("Please select at least one filter before searching");
    return;
  }

  try {

    logInfo("Calling search API", searchFilters);
    const res = await fetch("https://mobile.coastal.bank.in:5001/api/sma/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": localStorage.getItem("userId")
      },
      body: JSON.stringify({
  ...filters,
  cluster: isRegionalManager ? userCluster : filters.cluster
})
    });

    const data = await res.json();
    logSuccess("Search API response received", { count: data.length });

    setRecords(data);
    logInfo("Records stored in state");
    setRecordCount(data.length);
    logInfo("Record count updated", data.length);
    setCurrentPage(1);
    logInfo("Pagination reset after search");

  } catch (err) {
    logError("SMA search error", err);
  }

};

  const handleReset = () => {
    logInfo("Reset triggered");

  if (isRegionalManager) {

    setFilters({
      mobileNumber: "",
      cluster: userCluster,
      branch: "",
      accountNumber: "",
      customerName: "",
      dataType: "",
      product: "",
      productGroup: "",
      loanType: "",
      newIrac: ""
    });

  } else {

    setFilters({
      mobileNumber: "",
      cluster: "",
      branch: "",
      accountNumber: "",
      customerName: "",
      dataType: "",
      product: "",
      productGroup: "",
      loanType: "",
      newIrac: ""
    });

  }
logInfo("Clearing records and filters");
  setRecords([]);
  setRecordCount(0);
  setSelectedRows([]);
  setSelectAllCurrentPage(false);
  logSuccess("Reset completed");
};

  const handleViewDetails = async (accountNumber) => {
    logInfo("View details clicked", accountNumber);

  try {

logInfo("Calling details API", accountNumber);
    const res = await fetch(
  `https://mobile.coastal.bank.in:5001/api/sma/details/${accountNumber}`,
  {
    headers: {
      "x-user-id": localStorage.getItem("userId")
    }
  }
);

    const data = await res.json();
    logSuccess("Details fetched", data);

    setViewDetailsData(data);
    setShowDetails(true);
    logInfo("Details modal opened");

  } catch (err) {

    logError("Details fetch error", err);

  }
};

  const indexOfLastRecord = currentPage * recordsPerPage;
const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

const safeRecords = Array.isArray(records) ? records : [];
const currentRecords = safeRecords.slice(indexOfFirstRecord, indexOfLastRecord);

const totalPages = Math.max(
  1,
  Math.ceil(records.length / recordsPerPage)
);

const firstRecord = records.length === 0 ? 0 : indexOfFirstRecord + 1;
const lastRecord = Math.min(indexOfLastRecord, records.length);

useEffect(() => {
  logInfo("Fetching filter data");

  logInfo("Calling filters API");
  fetch("https://mobile.coastal.bank.in:5001/api/sma/filters", {
    headers: {
      "x-user-id": localStorage.getItem("userId")
    }
  })
  .then(res => res.json())
  .then(data => {
    logSuccess("Filters data received", data);
    setClusters(data.clusters);

if (!isRegionalManager) {
  setBranches(data.branches);
}

    setProducts(data.products);
    setProductGroups(data.productGroup);
    setLoanTypes(data.loanType);
    setNewIracOptions(data.newIrac);

  })
  .catch(err => logError("SMA filters error", err));

}, [isRegionalManager, userCluster]);

const handleClusterChange = (e) => {
  logInfo("Cluster changed", e.target.value);

  const cluster = e.target.value;

  setFilters(prev => ({
    ...prev,
    cluster: cluster,
    branch: ""   // reset branch when cluster changes
  }));

  if (!cluster) {
    logInfo("Fetching all branches (no cluster selected)");
    logInfo("Calling all branches API");
  // fetch ALL branches
  fetch("https://mobile.coastal.bank.in:5001/api/sma/branches/")
  .then(res => res.json())
  .then(data => {
    logSuccess("Branches fetched", data.length);
    setBranches(data);
  })
    .catch(err => logError("Branch fetch error", err));

  return;
}

logInfo("Calling cluster branches API", cluster);
  fetch(`https://mobile.coastal.bank.in:5001/api/sma/branches/${cluster}`)
    .then(res => res.json())
    .then(data => {
      setBranches(data);
    })
    .catch(err => logError("Branch fetch error", err));

};

useEffect(() => {
  logInfo("Regional Manager cluster auto-load", userCluster);

  if (isRegionalManager) {

    setFilters(prev => ({
      ...prev,
      cluster: userCluster
    }));

logInfo("Fetching branches for RM cluster", userCluster);
    // Load only branches under RM cluster
    fetch(`https://mobile.coastal.bank.in:5001/api/sma/branches/${userCluster}`)
      .then(res => res.json())
      .then(data => setBranches(data))
      .catch(err => logError("Branch fetch error", err));

  }

}, [isRegionalManager, userCluster]);

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

        {/* Filters */}
        <div className="grid grid-cols-4 gap-6 mb-6">

          <Input label="Mobile Number"
            value={filters.mobileNumber}
            onChange={(e) => {
  logInfo("Mobile filter changed", e.target.value);
  setFilters({ ...filters, mobileNumber: e.target.value });
}}
          />

          <Select
 label="Cluster"
 options={clusters}
 valueKey="code"
 labelKey="name"
 value={filters.cluster}
 onChange={(e) => {
   if (isRegionalManager) return;
   handleClusterChange(e);
 }}
 disabled={isRegionalManager}
/>

<Select
 label="Branch"
 options={branches}
 valueKey="branch"
 labelKey="branch"
 value={filters.branch}
 onChange={(e) => {
  logInfo("Branch filter changed", e.target.value);
  setFilters({ ...filters, branch: e.target.value });
}}
/>

          <Input label="Account No."
            value={filters.accountNumber}
            onChange={(e) => {
  logInfo("Account Number filter changed", e.target.value);
  setFilters({ ...filters, accountNumber: e.target.value });
}}
          />

          <Input label="Customer Name"
            value={filters.customerName}
            onChange={(e) => {
  logInfo("Customer Name filter changed", e.target.value);
  setFilters({ ...filters, customerName: e.target.value });
}}
          />

          <Select
  label="Data Type"
  options={[
    { type: "SMA" },
    { type: "NPA" }
  ]}
  valueKey="type"
  labelKey="type"
  value={filters.dataType}
 onChange={(e) => {
  logInfo("Data Type filter changed", e.target.value);
  setFilters({ ...filters, dataType: e.target.value });
}
  }
/>

          <Select
 label="Product"
 options={products}
 valueKey="product"
 labelKey="product"
 value={filters.product}
 onChange={(e) => {
  logInfo("Product filter changed", e.target.value);
  setFilters({ ...filters, product: e.target.value });
}}
/>

          <Select
 label="Product Group"
 options={productGroups}
 valueKey="productGroup"
 labelKey="productGroup"
 value={filters.productGroup}
 onChange={(e) => {
  logInfo("Product Group filter changed", e.target.value);
  setFilters({ ...filters, productGroup: e.target.value });
}}
/>

          <Select
 label="Loan Type"
 options={loanTypes}
 valueKey="loanType"
 labelKey="loanType"
 value={filters.loanType}
 onChange={(e) => {
  logInfo("Loan Type filter changed", e.target.value);
  setFilters({ ...filters, loanType: e.target.value });
}}
/>

          <Select
 label="New IRAC"
 options={newIracOptions}
 valueKey="newIrac"
 labelKey="newIrac"
 value={filters.newIrac}
 onChange={(e) => {
  logInfo("New IRAC filter changed", e.target.value);
  setFilters({ ...filters, newIrac: e.target.value });
}}
/>

        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4 mb-6">

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-200 rounded"
          >
            Reset
          </button>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Search
          </button>

          <span className="text-sm text-slate-500">
            No of Records fetched : {recordCount}
          </span>

        </div>

        {/* Table */}

        <div className="border rounded-lg overflow-x-auto bg-white">

          <table className="w-full text-sm border border-slate-300">

            <thead className="bg-slate-50">

              <tr>

                <th className="p-3 border text-center">
                  <input
                    type="checkbox"
                    checked={selectAllCurrentPage}
                    onChange={(e) => {
                      logInfo("Select all toggled", e.target.checked);
                      const checked = e.target.checked;
                      setSelectAllCurrentPage(checked);

                      if (checked) {
  setSelectedRows(currentRecords.map(r => r.accountNumber));
} else {
  setSelectedRows([]);
}
                    }}
                  />
                </th>

                {[
                  "S. No.",
                  "Customer Name",
                  "Account Number",
                  "Product",
                  "Mobile Number",
                  "Branch",
                  "Action"
                ].map((h) => (
                  <th key={h} className="p-3 border text-left font-medium">
                    {h}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody>

              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No records found
                  </td>
                </tr>
              )}

              {currentRecords.map((row, index) => {

                const serialNumber =
  (currentPage - 1) * recordsPerPage + index + 1;

                return (
                  <tr key={index}>

                    <td className="p-3 border text-center">

                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.accountNumber)}
                        onChange={(e) => {
                          logInfo("Row selection changed", row.accountNumber);
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, row.accountNumber]);
                          } else {
                            setSelectedRows(
                              selectedRows.filter(id => id !== row.accountNumber)
                            );
                          }
                        }}
                      />

                    </td>

                    <td className="p-3 border">{serialNumber}</td>
                    <td className="p-3 border">{row.customerName}</td>
                    <td className="p-3 border">{row.accountNumber}</td>
                    <td className="p-3 border">{row.product}</td>
                    <td className="p-3 border">{row.mobileNumber ?? ""}</td>
                    <td className="p-3 border">{row.branch}</td>

                    <td className="p-3 border">

                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => handleViewDetails(row.accountNumber)}
                      >
                        View Details
                      </button>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>

        {/* Pagination */}
<div className="flex items-center justify-between mt-4 text-sm text-slate-600">

  <div>
    Showing {firstRecord}-{lastRecord} of {records.length}
  </div>

  <div className="flex items-center gap-2">

    <button
      disabled={currentPage === 1}
      onClick={() => {
  logInfo("Pagination → First page");
  setCurrentPage(1);
}}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ⏮
    </button>

    <button
      disabled={currentPage === 1}
      onClick={() => {
  logInfo("Pagination → Previous page");
  setCurrentPage(prev => prev - 1);
}}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ◀
    </button>

    <span>Page {currentPage} of {totalPages}</span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => {
  logInfo("Pagination → Next page");
  setCurrentPage(prev => prev + 1);
}}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ▶
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => {
  logInfo("Pagination → Last page");
  setCurrentPage(totalPages);
}}
      className="px-2 py-1 border rounded disabled:opacity-50"
    >
      ⏭
    </button>

  </div>

</div>

      </div>



      {/* Details Popup */}

      {showDetails && (

        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

          <div className="bg-white w-[900px] max-h-[80vh] overflow-y-auto rounded-xl shadow-lg p-6 relative">

            <button
              className="absolute top-4 right-4 text-gray-500"
              onClick={() => {
  logInfo("Details modal closed");
  setShowDetails(false);
}}
            >
              ✖
            </button>

            <h2 className="text-xl font-semibold mb-6 border-b pb-2">
  SMA Account Details
</h2>

            {viewDetailsData && (

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">

                <ReadOnly label="Customer Name" value={viewDetailsData.customerName} />
                <ReadOnly label="Branch" value={viewDetailsData.branch} />

                <ReadOnly label="Cluster" value={viewDetailsData.cluster} />
                <ReadOnly label="Limit" value={viewDetailsData.limit} />

                <ReadOnly label="Drawing Power" value={viewDetailsData.drawingPower} />
                <ReadOnly label="Int Rate" value={viewDetailsData.intRate} />

                <ReadOnly label="Theo Balance" value={viewDetailsData.theoBalance} />
                <ReadOnly label="Cleared Balance" value={viewDetailsData.clearedBalance} />

                <ReadOnly label="Uncleared Balance" value={viewDetailsData.unclearedBalance} />
                <ReadOnly label="Outstanding Balance" value={viewDetailsData.outstandingBalance} />

                <ReadOnly label="Overdue" value={viewDetailsData.overdue} />
                <ReadOnly label="Sanction Date" value={formatExcelDate(viewDetailsData.sanctionDate)} />

                <ReadOnly label="Expiry Date" value={formatExcelDate(viewDetailsData.expiryDate)} />
                <ReadOnly label="EMIs Due" value={viewDetailsData.emisDue} />

                <ReadOnly label="EMIs Paid" value={viewDetailsData.emisPaid} />
                <ReadOnly label="EMIs OD" value={viewDetailsData.emisOD} />

                <ReadOnly label="NEW IRAC" value={viewDetailsData.newIrac} />
                <ReadOnly label="OLD IRAC" value={viewDetailsData.oldIrac} />

                <ReadOnly label="NPA Date" value={formatExcelDate(viewDetailsData.npaDate)} />
                <ReadOnly label="Arrear Condition" value={viewDetailsData.arrearCondition} />

                <ReadOnly
                  label="Arrear Description"
                  value={viewDetailsData.arrearDescription}
                  textarea
                />

              </div>

            )}

          </div>

        </div>

      )}

    </main>
  );
};


/* Reusable Components */

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
    />
  </div>
);

const Select = ({
  label,
  options = [],
  valueKey,
  labelKey,
  value,
  onChange,
  disabled
}) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>

    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full mt-1 px-3 py-2 border rounded transition-all
        ${
          disabled
            ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
            : "bg-slate-100 text-black"
        }`}
    >
      <option value="">Select</option>

      {Array.isArray(options) &&
  options
    .filter(item => item && item[valueKey] && item[labelKey]) // ✅ REMOVE EMPTY VALUES
    .map((item, index) => (
      <option key={index} value={item[valueKey]}>
        {item[labelKey]}
      </option>
    ))}
    </select>
  </div>
);

const ReadOnly = ({ label, value, textarea = false }) => (
  <div>
    <label className="text-sm text-slate-600">{label}</label>

    {textarea ? (
      <textarea
        value={value ?? ""}
        disabled
        rows={3}
        className="w-full mt-1 px-3 py-2 border rounded bg-slate-100 resize-none"
      />
    ) : (
      <input
        type="text"
        value={value ?? ""}
        disabled
        className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
      />
    )}

  </div>
);

export default SMAList;