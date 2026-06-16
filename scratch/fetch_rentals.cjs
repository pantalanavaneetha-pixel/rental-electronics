fetch('http://localhost:5000/api/rentals')
  .then(res => res.json())
  .then(data => {
    console.log("Rentals length:", data.data ? data.data.length : 0);
    if (data.data) {
      data.data.forEach(r => {
        console.log(`ID: ${r.rentalId}, EndDate: ${r.endDate}, Status: ${r.settlementStatus}, Customer: ${r.customerName}, Phone: ${r.customerPhone}`);
      });
    }
  })
  .catch(err => console.error(err));
