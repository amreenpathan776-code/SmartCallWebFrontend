import { useState, useEffect } from "react";

// ✅ Logger
const logInfo = (msg, data) => console.log(`📡 ${msg}`, data || "");
const logSuccess = (msg, data) => console.log(`✅ ${msg}`, data || "");
const logError = (msg, data) => console.error(`❌ ${msg}`, data || "");
const logWarn = (msg, data) => console.warn(`⚠️ ${msg}`, data || "");

const SMAActivityStatus = () => {

  const [filters, setFilters] = useState({
    mobileNumber: "",
    cluster: "",
    branch: "",
    accountNumber: "",
    customerName: "",
    product: "",
    productGroup: "",
    loanType: "",
    newIrac: ""
  });

  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [clusters, setClusters] = useState([]);
const [products, setProducts] = useState([]);
const [productGroups, setProductGroups] = useState([]);
const [loanTypes, setLoanTypes] = useState([]);
const [newIracOptions, setNewIracOptions] = useState([]);
const [showActivity, setShowActivity] = useState(false);
const [activityLogs, setActivityLogs] = useState([]);

const [currentPage, setCurrentPage] = useState(1);
const recordsPerPage = 15;

const indexOfLastRecord = currentPage * recordsPerPage;
const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

const safeData = Array.isArray(data) ? data : [];
const currentRecords = safeData.slice(indexOfFirstRecord, indexOfLastRecord);

const totalPages = Math.max(
  1,
  Math.ceil(data.length / recordsPerPage)
);

const firstRecord = data.length === 0 ? 0 : indexOfFirstRecord + 1;
const lastRecord = Math.min(indexOfLastRecord, data.length);

useEffect(() => {
  logInfo("Fetching filter data");

  logInfo("Calling filters API");
fetch("https://mobile.coastal.bank.in:5001/api/sma/filters")
.then(res => res.json())
.then(data => {
logSuccess("Filters loaded", data);

setClusters(data.clusters);
setProducts(data.products);
setProductGroups(data.productGroup);
setLoanTypes(data.loanType);
setNewIracOptions(data.newIrac);

})
.catch(err => logError("Filter load error", err));

}, []);

  const handleChange = (e) => {

const { name, value } = e.target;

logInfo("Filter changed", { name, value });

setFilters({
  ...filters,
  [name]: value
});

if (name === "cluster") {
logInfo("Cluster selected, fetching branches", value);

  logInfo("Calling branches API", value);
fetch(`https://mobile.coastal.bank.in:5001/api/sma/branches/${value}`)
.then(res => res.json())
.then(data => {
  logSuccess("Branches loaded", data.length);
  setBranches(data);
})
.catch(err => logError("Branch fetch error", err));

}

};

  const handleReset = () => {
    logInfo("Reset triggered");

  if (isRegionalManager) {

    setFilters({
      mobileNumber: "",
      cluster: userCluster,   // keep RM cluster
      branch: "",
      accountNumber: "",
      customerName: "",
      product: "",
      productGroup: "",
      loanType: "",
      newIrac: ""
    });

    fetch(`https://mobile.coastal.bank.in:5001/api/sma/branches/${userCluster}`)
  .then(res => res.json())
  .then(data => {
    logSuccess("Branches loaded after reset", data.length);
    setBranches(data);
  })
  .catch(err => logError("Branch fetch error", err));

  } else {

    setFilters({
      mobileNumber: "",
      cluster: "",
      branch: "",
      accountNumber: "",
      customerName: "",
      product: "",
      productGroup: "",
      loanType: "",
      newIrac: ""
    });

    setBranches([]);

  }
  
  logInfo("Clearing table & activity logs");
  setData([]);
  setShowActivity(false);
  setActivityLogs([]);
  logSuccess("Reset completed");

};

  const handleSearch = async () => {
    logInfo("Search triggered", filters);

    const hasFilter = Object.values(filters).some(v => v !== "");

if (!hasFilter) {
  logWarn("Search attempted without filters");
  alert("Please select at least one filter");
  return;
}

    logInfo("Calling activity search API");
const res = await fetch(
"https://mobile.coastal.bank.in:5001/api/sma/activity/search",
{
method:"POST",
headers:{
"Content-Type":"application/json",
"x-user-id": localStorage.getItem("userId") || "",
"x-user-role": localStorage.getItem("role") || "",
"x-user-branch": localStorage.getItem("branchName") || "",
"x-user-cluster": localStorage.getItem("clusterName") || ""
},
body: JSON.stringify({
  ...filters,
  cluster: isRegionalManager ? userCluster : filters.cluster
})
}
);

const result = await res.json();
logSuccess("Search results received", Array.isArray(result) ? result.length : 0);

logInfo("Setting search data");
setData(result);

if (result.length === 0) {
  logWarn("No records found for search");
}

};

const handleViewActivity = async (accountNumber) => {
  logInfo("View activity clicked", accountNumber);

try{

const res = await fetch(
"https://mobile.coastal.bank.in:5001/api/sma-activity-details",
{
method:"POST",
headers:{
"Content-Type":"application/json",
"x-user-id": localStorage.getItem("userId") || "",
"x-user-role": localStorage.getItem("role") || "",
"x-user-branch": localStorage.getItem("branchName") || "",
"x-user-cluster": localStorage.getItem("clusterName") || ""
},
body:JSON.stringify({
accountNumber: accountNumber
})
}
);

const data = await res.json();
logSuccess("Activity logs fetched", Array.isArray(data) ? data.length : 0);

setActivityLogs(Array.isArray(data) ? data : []);

if (!data || data.length === 0) {
  logWarn("No activity logs found");
}

logInfo("Opening activity modal");
setShowActivity(true);

}catch(err){
logError("Activity fetch error", err);
setActivityLogs([]);
setShowActivity(true);
}

};

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

const isRegionalManager = role?.includes("Regional Manager");
const isBranchManager = role === "Branch Manager";

useEffect(() => {

  if (isRegionalManager) {
    logInfo("Regional Manager detected", userCluster);

    setFilters(prev => ({
      ...prev,
      cluster: userCluster
    }));

    logInfo("Fetching branches for RM cluster", userCluster);
    fetch(`https://mobile.coastal.bank.in:5001/api/sma/branches/${userCluster}`)
      .then(res => res.json())
      .then(data => {
  logSuccess("Branches loaded for RM", data.length);
  setBranches(data);
})
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

<div className="bg-white rounded-xl shadow p-8">

<h2 className="text-xl font-semibold mb-6">
SMA Activity Status
</h2>


{/* Filters */}

<div className="grid grid-cols-4 gap-6 mb-6">

{/* Mobile Number */}
<div>
<label className="text-sm text-slate-600">
Mobile Number
</label>
<input
type="text"
name="mobileNumber"
value={filters.mobileNumber}
onChange={handleChange}
className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
/>
</div>

{/* Cluster */}
<div>
<label className="text-sm text-slate-600">
Cluster
</label>
<select
  name="cluster"
  value={filters.cluster}
  onChange={(e) => {
    if (isRegionalManager) return;
    handleChange(e);
  }}
  disabled={isRegionalManager}
  className={`w-full mt-1 px-3 py-2 border rounded transition-all
    ${
      isRegionalManager
        ? "bg-slate-300 text-black font-semibold border-slate-400 cursor-not-allowed"
        : "bg-slate-100"
    }`}
>
<option value="">Select</option>

{clusters
  .filter(c => c && c.code && c.name) // ✅ remove empty values
  .map((c, index) => (
    <option key={index} value={c.code}>
      {c.name}
    </option>
  ))}

</select>
</div>

{/* Branch */}
<div>
<label className="text-sm text-slate-600">
Branch
</label>
<select
name="branch"
value={filters.branch}
onChange={handleChange}
className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
>

<option value="">Select</option>

{branches.map((b,index)=>(
<option key={index} value={b.branch}>
{b.branch}
</option>
))}

</select>
</div>

{/* Account Number */}
<div>
<label className="text-sm text-slate-600">
Account No.
</label>
<input
type="text"
name="accountNumber"
value={filters.accountNumber}
onChange={handleChange}
className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
/>
</div>

{/* Customer Name */}
<div>
<label className="text-sm text-slate-600">
Customer Name
</label>
<input
type="text"
name="customerName"
value={filters.customerName}
onChange={handleChange}
className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
/>
</div>

{/* Product */}
<div>
<label className="text-sm text-slate-600">
Product
</label>
<select
name="product"
value={filters.product}
onChange={handleChange}
className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
>

<option value="">Select</option>

{products.map((p,index)=>(
<option key={index} value={p.product}>
{p.product}
</option>
))}

</select>
</div>

{/* Product Group */}
<div>
<label className="text-sm text-slate-600">
Product Group
</label>
<select
name="productGroup"
value={filters.productGroup}
onChange={handleChange}
className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
>

<option value="">Select</option>

{productGroups.map((p,index)=>(
<option key={index} value={p.productGroup}>
{p.productGroup}
</option>
))}

</select>
</div>

{/* Loan Type */}
<div>
<label className="text-sm text-slate-600">
Loan Type
</label>
<select
name="loanType"
value={filters.loanType}
onChange={handleChange}
className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
>

<option value="">Select</option>

{loanTypes.map((l,index)=>(
<option key={index} value={l.loanType}>
{l.loanType}
</option>
))}

</select>
</div>

{/* New IRAC */}
<div>
<label className="text-sm text-slate-600">
New IRAC
</label>
<select
name="newIrac"
value={filters.newIrac}
onChange={handleChange}
className="w-full mt-1 px-3 py-2 border rounded bg-slate-100"
>

<option value="">Select</option>

{newIracOptions.map((i,index)=>(
<option key={index} value={i.newIrac}>
{i.newIrac}
</option>
))}

</select>
</div>

</div>


{/* Buttons */}

<div className="mt-6 flex gap-4">

<button
onClick={handleReset}
className="px-4 py-2 bg-gray-300 rounded-lg"
>
Reset
</button>

<button
onClick={handleSearch}
className="px-4 py-2 bg-blue-600 text-white rounded-lg"
>
Search
</button>

<span className="ml-4 mt-2 text-sm text-gray-500">
No of Records fetched : {data.length}
</span>

</div>


{/* Table */}

<div className="mt-6 overflow-x-auto">

<table className="w-full border">

<thead className="bg-gray-100">

<tr>

<th className="border p-2">
<input type="checkbox"/>
</th>

<th className="border p-2">S. No.</th>
<th className="border p-2">Customer Name</th>
<th className="border p-2">Account Number</th>
<th className="border p-2">Product</th>
<th className="border p-2">Mobile Number</th>
<th className="border p-2">Branch</th>
<th className="border p-2">Activity Details</th>

</tr>

</thead>

<tbody>

{data.length === 0 ? (

<tr>
<td colSpan="8" className="text-center p-4 text-gray-500">
No records found
</td>
</tr>

) : (

currentRecords.map((item, index) => (

<tr key={index}>

<td className="border p-2">
<input type="checkbox"/>
</td>

<td className="border p-2">
{(currentPage - 1) * recordsPerPage + index + 1}
</td>
<td className="border p-2">{item.customerName}</td>
<td className="border p-2">{item.accountNumber}</td>
<td className="border p-2">{item.product}</td>
<td className="border p-2">{item.mobileNumber}</td>
<td className="border p-2">{item.branch}</td>

<td className="border p-2">
<button
className="text-blue-600 hover:underline"
onClick={() => handleViewActivity(item.accountNumber)}
>
View Details
</button>
</td>

</tr>

))

)}

</tbody>

</table>

</div>

{data.length > 0 && (

<div className="flex items-center justify-between mt-4 text-sm text-slate-600">

  <div>
    Showing {firstRecord}-{lastRecord} of {data.length}
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

    <span>
      Page {currentPage} of {totalPages}
    </span>

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

)}

{showActivity && (

<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

<div className="bg-white rounded-xl shadow-xl w-[1100px] max-h-[80vh] overflow-y-auto p-6">

<h2 className="text-lg font-semibold mb-4">
Activity Details
</h2>

<table className="w-full border">

<thead className="bg-gray-100">

<tr>
<th className="border p-2">Activity Date</th>
<th className="border p-2">Activity Time</th>
<th className="border p-2">User Name</th>
<th className="border p-2">Activity Type</th>
<th className="border p-2">Activity Status</th>
<th className="border p-2">Notes</th>
</tr>

</thead>

<tbody>

{activityLogs.length === 0 ? (

<tr>
<td colSpan="6" className="text-center p-4">
No Activity Found
</td>
</tr>

) : (

activityLogs.map((log,index)=>(

<tr key={index}>

<td className="border p-2">
{log.activityDate}
</td>

<td className="border p-2">
{log.activityTime}
</td>

<td className="border p-2">
{log.userName}
</td>

<td className="border p-2">
{log.activityType}
</td>

<td className="border p-2 whitespace-pre-line">
{log.activityStatus}
</td>

<td className="border p-2 whitespace-pre-line">
{log.notes}
</td>

</tr>

))

)}

</tbody>

</table>

<div className="mt-6 text-right">

<button
onClick={() => {
  logInfo("Activity modal closed");
  setShowActivity(false);
}}
className="px-4 py-2 bg-gray-300 rounded"
>
Close
</button>

</div>

</div>

</div>

)}

</div>

  );
};


export default SMAActivityStatus;