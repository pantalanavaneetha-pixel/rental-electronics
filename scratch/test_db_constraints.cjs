// Test missing email field validation on backend
const payloadMissingEmail = {
  userName: "Constraints Tester",
  userEmail: "", // Missing
  userPhone: "+919999988888",
  isCorporate: false,
  kycStatus: "Verified",
  deviceSerial: "SR-TEST1234",
  deviceCategory: "iPad Pro M4",
  deviceBaseCost: 80000,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  securityDeposit: 25000,
  baseTariff: 2500,
  initialConditionNotes: "Constraint test"
};

fetch('http://localhost:5000/api/rentals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payloadMissingEmail)
})
  .then(res => res.json())
  .then(data => {
    console.log("Missing Email Error Response:", JSON.stringify(data, null, 2));
  })
  .catch(err => console.error("Error:", err));
