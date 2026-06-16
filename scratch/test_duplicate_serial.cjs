// Attempt to post twice with same serial number to trigger unique key constraint checks
const payload = {
  userName: "Unique Serial Tester",
  userEmail: `unique.serial.${Date.now()}@example.com`,
  userPhone: "+919999988888",
  isCorporate: false,
  kycStatus: "Verified",
  deviceSerial: "SR-DUPLICATED-111", // Duplicated Serial
  deviceCategory: "iPad Pro M4",
  deviceBaseCost: 80000,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  securityDeposit: 25000,
  baseTariff: 2500,
  initialConditionNotes: "Serial unique constraint test"
};

const makePost = () => {
  return fetch('http://localhost:5000/api/rentals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json());
};

makePost()
  .then(res1 => {
    console.log("Post 1 Response:", JSON.stringify(res1, null, 2));
    // Try posting again with the same serial number (device is already rented/exists)
    return makePost();
  })
  .then(res2 => {
    console.log("Post 2 Response (Should error due to availability/uniqueness):", JSON.stringify(res2, null, 2));
  })
  .catch(err => console.error("Error:", err));
