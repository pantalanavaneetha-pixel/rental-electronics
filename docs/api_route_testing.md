# First API Route & Static Form Construction Log

This document logs the development, UI layout, and endpoint verification for **Day 5** of the project.

---

## 🖥️ Frontend Form Construction
The intake and return forms are implemented inside [Dashboard.jsx](file:///c:/Users/panta/OneDrive/Desktop/Rental%20Electronics%20and%20damage%20settlement/src/views/Dashboard.jsx) and [ReturnForm.jsx](file:///c:/Users/panta/OneDrive/Desktop/Rental%20Electronics%20and%20damage%20settlement/src/views/ReturnForm.jsx):

### 1. Form Inputs Scaffolding
- **Customer Identity**: Customer Full Name text input, sanitized email input.
- **E.164 Phone Dialer**: Integrated E.164 phone validation regex highlighting borders in red (`.input-error-state`) if invalid on blur.
- **Device Selector**: Category dropdown (e.g. iPad Pro M4, MacBook Pro M3) and auto-generated serial numbers.
- **Deposit Fields**: Locked amount field dynamically prefixed with selected currency symbols (`₹`, `$`, `€`).
- **Inspection Checklist**: Dropdown damage type selector (`None`, `Cracked Screen`, `Water Damage`).
- **File Upload / Media Capture**: File uploader + live webcam stream for physical asset verification.

---

## 🗄️ Database Connection
The backend server initializes SQLite and PostgreSQL connection pools dynamically inside [db.js](file:///c:/Users/panta/OneDrive/Desktop/Rental%20Electronics%20and%20damage%20settlement/server/config/db.js):
- Reads database host credentials from `.env`.
- Automatically connects and self-heals by running table migrations if database files are not found or schemas are missing columns.

---

## 📡 API Endpoint Testing Log (POST /api/rentals)

The endpoint `POST /api/rentals` was pinged to confirm successful record writing to the relational database:

### Request Details
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/rentals`
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "userName": "Test User",
    "userEmail": "test.user.104@example.com",
    "userPhone": "+919999988888",
    "isCorporate": false,
    "kycStatus": "Verified",
    "deviceSerial": "SR-95104",
    "deviceCategory": "iPad Pro M4",
    "deviceBaseCost": 80000,
    "startDate": "2026-06-16T10:34:08Z",
    "endDate": "2026-06-23T10:34:08Z",
    "securityDeposit": 25000,
    "baseTariff": 2500,
    "initialConditionNotes": "New test unit"
  }
  ```

### Response Details
- **Status Code**: `201 Created`
- **Response Body**:
  ```json
  {
    "success": true,
    "message": "Rental transaction initiated successfully.",
    "data": {
      "id": "RENT-99BG8J",
      "user_id": "CUST-RTFWGX",
      "device_id": "d4",
      "start_date": "1781606050483.0",
      "end_date": "1782210850484.0",
      "security_deposit": 25000,
      "base_tariff": 2500,
      "initial_condition_notes": "New test unit",
      "status": "Active",
      "created_at": "2026-06-16T10:34:10.622Z",
      "customer_email": null
    }
  }
  ```
- **Database Write Verification**: Verified that the SQL engine successfully committed the record into the `rentals` table.
