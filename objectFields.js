// Single source of truth for which fields each object exposes in the UI.
// Between 5 and 10 fields per object, per the assignment spec.
// Id is always included separately and is never part of these lists.

module.exports = {
  Account: ["Name", "Industry", "Phone", "Website", "BillingCity", "AnnualRevenue", "NumberOfEmployees"],
  Opportunity: ["Name", "StageName", "Amount", "CloseDate", "Probability", "Type"],
  Lead: ["FirstName", "LastName", "Company", "Email", "Phone", "Status", "LeadSource"],
  Contact: ["FirstName", "LastName", "Email", "Phone", "Title", "Department"],
  Case: ["Subject", "Status", "Priority", "Origin", "Description", "CaseNumber"],
};

// A friendly display field per object, used as the default sort/order column.
module.exports.SORT_FIELD = {
  Account: "Name",
  Opportunity: "Name",
  Lead: "LastName",
  Contact: "LastName",
  Case: "CaseNumber",
};

module.exports.SUPPORTED_OBJECTS = Object.keys(module.exports).filter(
  (k) => k !== "SORT_FIELD" && k !== "SUPPORTED_OBJECTS"
);
