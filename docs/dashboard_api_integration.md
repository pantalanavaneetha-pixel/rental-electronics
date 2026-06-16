# Dashboard Integration & API Hooking Log

This document records the React lifecycle hooking, backend HTTP response codes, error handlers, and network verification logs for **Day 9** of the project.

---

## 🖥️ Frontend API Hooking (`useEffect`)
The React application eliminates hardcoded lists by executing an asynchronous fetch inside [App.jsx](file:///c:/Users/panta/OneDrive/Desktop/Rental%20Electronics%20and%20damage%20settlement/src/App.jsx):

```javascript
  // Shared mock collection simulating a running live operational table
  const [records, setRecords] = useState([]);

  // Fetch records from backend API
  const fetchRecords = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/rentals');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      } else {
        throw new Error('API response not OK');
      }
    } catch (err) {
      console.warn("Express backend server offline. Falling back to local storage...");
      // offline fallback local storage logic...
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentView]);
```
- **Result**: The dashboard, settlement, and incident ledgers are instantly populated with live records fetched from the backend API.

---

## 🗄️ Backend HTTP Status Codes & Centralized Error Middleware

The server returns standardized REST response codes:
- **`200 OK`**: Returned for all successful queries and updates.
- **`201 Created`**: Returned when a new rental lease is committed.
- **`400 Bad Request`**: Returned when payload parameter validations fail.
- **`403 Forbidden`**: Returned for KYC blocks.
- **`500 Internal Server Error`**: Intercepted by the centralized error handler [errorHandler.js](file:///c:/Users/panta/OneDrive/Desktop/Rental%20Electronics%20and%20damage%20settlement/server/middlewares/errorHandler.js).

```javascript
// centralized errorHandler.js excerpt
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
```

---

## 📡 End-to-End Network Verification Logs

To confirm that the integration operates successfully, we monitored the browser developer console network requests on application boot:

### Request Frame
- **API Request URL**: `GET http://localhost:5000/api/rentals`
- **Trigger**: Triggered by the `useEffect` hook in `App.jsx` on view mount.
- **Initiator**: `App.jsx:94 (async fetchRecords)`
- **Response Status**: `200 OK` (via disk cache / network fetch)

### UI Binding Verification
- Metrics cards update immediately (e.g. "Total Deposits" displays total sum of active deposits, "Due Today" displays today's count).
- Data table renders exactly the mock seed array retrieved from the API (`RENT-G6H2Y9`, `RENT-M4K7N1`, etc.) without visual delay.
