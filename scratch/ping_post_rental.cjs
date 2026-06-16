const payload = {
  userName: "Test User",
  userEmail: `test.user.${Math.floor(Math.random() * 1000)}@example.com`,
  userPhone: "+919999988888",
  isCorporate: false,
  kycStatus: "Verified",
  deviceSerial: `SR-${Math.floor(10000 + Math.random() * 90000)}`,
  deviceCategory: "iPad Pro M4",
  deviceBaseCost: 80000,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  securityDeposit: 25000,
  baseTariff: 2500,
  initialConditionNotes: "New test unit"
};

fetch('http://localhost:5000/api/rentals', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    console.log("POST /api/rentals Response:", JSON.stringify(data, null, 2));
  })
  .catch(err => console.error("Error pinging POST route:", err));
