# Backend API Endpoint Specifications

This document outlines the core backend API endpoints, payload contracts, validation rules, and processing logic for the **RentShield CC** server.

---

## 🔑 Base URL
`http://localhost:5000/api`

---

## 📋 Core API Operations

### 1. Create a Rental Contract
- **Endpoint**: `POST /rentals`
- **Description**: Registers a new customer lease ticket, checks KYC status compatibility, logs device availability transition to `'Rented'`, and holds the security deposit.
- **Request Payload (`application/json`)**:
  ```json
  {
    "userName": "Alex Mercer",
    "userEmail": "alex.mercer@example.com",
    "userPhone": "+919876543210",
    "isCorporate": false,
    "kycStatus": "Verified",
    "deviceSerial": "SR-98310",
    "deviceCategory": "iPad Pro M4",
    "deviceBaseCost": 80000,
    "startDate": "2026-06-16T00:00:00.000Z",
    "endDate": "2026-06-23T00:00:00.000Z",
    "securityDeposit": 25000,
    "baseTariff": 2500,
    "initialConditionNotes": "Clean, screen protector applied"
  }
  ```
- **Validation Rules**:
  - `userEmail` must be a valid email format.
  - `userPhone` must match the international E.164 pattern (no letters, spaces, or hyphens allowed in backend storage).
  - `kycStatus` must be `'Verified'` to permit rental initialization.

---

### 2. Process Return & File a Claim
- **Endpoint**: `POST /returns` (or `POST /claims/:rentalId/process`)
- **Description**: Submits the device return inspection audit from the Service Desk. Releases the device back to `'Available'` status, assesses physical damage multipliers, calculates daily overdue fees, and logs the claim.
- **Request Payload (`application/json`)**:
  ```json
  {
    "damageType": "Cracked Screen",
    "photoEvidenceUrl": "https://images.unsplash.com/photo-1595206133361-b1fe343e5e23",
    "damageDeduction": 12500,
    "daysOverdue": 1,
    "lateFeeCharged": 1500,
    "notes": "Physical drop impact cracked upper right digitizer."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Asset return processed and inspection logged.",
    "data": {
      "rentalId": "RENT-G6H2Y9",
      "settlementStatus": "Under Review",
      "damageDeduction": 12500,
      "lateFeeCharged": 1500,
      "netRefund": 36000
    }
  }
  ```

---

### 3. Read Settlement Status & Receipt Breakdown
- **Endpoint**: `GET /settlements/:rentalId`
- **Description**: Returns the cascading financial reconciliation data for rendering PDF transaction receipts and accounts clearance tables.
- **Response Payload**:
  ```json
  {
    "success": true,
    "data": {
      "rentalId": "RENT-G6H2Y9",
      "customerName": "Jane Smith",
      "deviceModel": "MacBook Pro M3",
      "securityDepositHeld": 50000,
      "damageDeduction": 12500,
      "lateFeeCharged": 1500,
      "netRefund": 36000,
      "status": "Under Review",
      "settledOn": null
    }
  }
  ```

---

### 4. Finalize & Approve Settlement Payout
- **Endpoint**: `PATCH /settlements/:rentalId`
- **Description**: Restores remaining funds to the customer account or drafts an invoice deficit, marks the rental status as `'Closed'`, and records audit trails.
- **Request Payload (`application/json`)**:
  ```json
  {
    "paymentMethod": "UPI Refund Transfer",
    "deductionAmount": 12500,
    "notes": "Clearance approved by Accounts Manager Priya."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Settlement finalized and remaining funds disbursed.",
    "status": "Settled"
  }
  ```

---

### 5. Toggle Emergency Triage Mode
- **Endpoint**: `PATCH /rentals/:id/triage`
- **Description**: Switches the rental lease into `'Isolated Repair'` state or resolves it back to review.
- **Request Payload**:
  ```json
  {
    "status": "Isolated Repair"
  }
  ```
