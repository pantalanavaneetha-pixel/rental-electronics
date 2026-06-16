# Database Schema Realization, Seeding & Constraints

This document records the verification logs and configurations of schemas, database constraints, and seeds for **Day 6**.

---

## 🖥️ Frontend Data Synchronization
The frontend form aligns input variable names and data types with the database schema definitions:
- **String to Float conversions**: Security Deposit and Deductions inputs are captured as text strings inside HTML input fields, parsed via `parseFloat(editDeposit)`, and translated using `toBase(depositNum, currency)` before submission to convert the current currency back into base currency integer format (base INR).
- **Date formats**: Dates are retrieved as string values from HTML date pickers (`YYYY-MM-DD`) and formatted into ISO-8601 strings (`new Date(editEndDate).toISOString()`) for database consistency.

---

## 🗄️ Database Seeding (Seed Records)
The relational engine auto-seeds the tables with initial mock entries on database resets (triggered by hitting `POST /api/reset` or during first-time initialization). Initial records include:
1. **Jane Smith** (`CUST-F8A3D9`): Verified KYC status, MacBook Pro M3 rental, security deposit INR 50,000, settlement status `'Held'`.
2. **Priya Patel** (`CUST-E2B8C4`): Pending KYC status, iPad Pro M4 rental, security deposit INR 15,000, settlement status `'Under Review'`.
3. **Amit Verma** (`CUST-D7F5E1`): Rejected KYC status, iPhone 15 Pro, security deposit INR 25,000, settlement status `'Settled'`.

---

## 🧪 Database Constraints & Error Validations Logs

### 1. Mandatory Field Rejection (Empty Fields)
Hitting the server API with missing mandatory parameters (like customer email) triggers interceptive Joi schema validations:
- **Request URL**: `POST /api/rentals`
- **Error Response**:
  ```json
  {
    "success": false,
    "error": "Validation failed on incoming request parameters.",
    "details": [
      {
        "field": "userEmail",
        "message": "userEmail is not allowed to be empty"
      }
    ]
  }
  ```

### 2. Device Uniqueness & Availability Block (Duplicate Inputs)
Attempting to assign a device serial number that is already currently active in another lease results in a transaction rollback and error message:
- **Request URL**: `POST /api/rentals` (for `deviceSerial: "SR-DUPLICATED-111"`)
- **Error Response**:
  ```json
  {
    "success": false,
    "error": "Device serial SR-DUPLICATED-111 is currently not available (Status: Rented)."
  }
  ```
- **Result**: Core data integrity constraints successfully prevent duplicate asset rentals.
