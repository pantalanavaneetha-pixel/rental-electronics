// Fetch all rentals
fetch('http://localhost:5000/api/rentals')
  .then(res => res.json())
  .then(allData => {
    console.log("GET /api/rentals length:", allData.data ? allData.data.length : 0);
    if (allData.data && allData.data.length > 0) {
      console.log("Sample rental record:", JSON.stringify(allData.data[0], null, 2));
    }
    
    // Fetch filtered rentals
    return fetch('http://localhost:5000/api/rentals?status=Held');
  })
  .then(res => res.json())
  .then(filteredData => {
    console.log("GET /api/rentals?status=Held length:", filteredData.data ? filteredData.data.length : 0);
    if (filteredData.data && filteredData.data.length > 0) {
      console.log("Filtered records status check:", filteredData.data.every(r => r.settlementStatus === 'Held'));
    }
  })
  .catch(err => console.error("Error pinging GET rentals:", err));
