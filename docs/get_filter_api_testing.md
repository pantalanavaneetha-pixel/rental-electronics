# GET/list & Filter APIs Development Log

This document records the visual layouts, backend routing, and verification ping logs for **Day 7** of the project.

---

## 🖥️ Frontend Layout & Status Badges
The dashboard data rows represent client records dynamically mapping the backend JSON fields to table elements:
- **Columns**: Rental ID (monospaced ID tag), Customer Name (bold text style), and Tracking Status (styled badge).
- **Status Indicators Mapping**:
  - `Held` (Lease active/Active): Rendered in solid blue theme badge.
  - `Under Review` (Return pending audits/inspection): Rendered in solid amber warning theme badge.
  - `Isolated Repair` (Water damage triage lock): Rendered in solid red warning badge.
  - `Settled` (Payout disbursed/Closed): Rendered in solid green checkmark badge.

---

## 📡 GET API Routing & Parameter Filters
The endpoint `GET /api/rentals` (located in [rentals.js](file:///c:/Users/panta/OneDrive/Desktop/Rental%20Electronics%20and%20damage%20settlement/server/routes/rentals.js) and resolved by `listRentals` controller) fetches and filters records.

### Query Parameters Supported
- `status`: Filters records by operational status (e.g. `Held`, `Under Review`, `Isolated Repair`, `Settled`).
- `category`: Filters records by device category (e.g. `iPad Pro M4`).
- `serialNumber`: Search by device serial codes.

---

## 🔬 API Endpoint Test Logs (GET /api/rentals)

### 1. General GET List Ping
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/rentals`
- **Response**: `200 OK`
- **Output Sample (Array of Object)**:
  ```json
  [
    {
      "rentalId": "RENT-3EL3CN",
      "settlementStatus": "Held",
      "startDate": "1781606128440.0",
      "endDate": "1782210928441.0",
      "securityDepositHeld": 25000,
      "baseTariff": 2500,
      "notes": "Serial unique constraint test",
      "customerName": "Unique Serial Tester",
      "customerEmail": "unique.serial.1781606128440@example.com",
      "customerPhone": "+919999988888",
      "customerId": "CUST-WED7NY",
      "kycStatus": "Verified",
      "deviceSerial": "SR-DUPLICATED-111",
      "deviceCategory": "iPad Pro M4",
      "deviceModel": "iPad Pro M4",
      "damageType": "None",
      "photoEvidenceUrl": "",
      "damageDeduction": 0,
      "daysOverdue": 0,
      "lateFeeCharged": 0,
      "paymentMethod": null,
      "settlementAt": null
    }
  ]
  ```

### 2. Filtered GET List Ping (?status=Held)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/rentals?status=Held`
- **Response**: `200 OK`
- **Output Validation**: Verified that all returned array objects contain `"settlementStatus": "Held"`, returning `true` for constraint checks.
