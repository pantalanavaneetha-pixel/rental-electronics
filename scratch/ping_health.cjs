fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => {
    console.log("Health Check Response:", JSON.stringify(data, null, 2));
  })
  .catch(err => console.error("Error pinging server:", err));
