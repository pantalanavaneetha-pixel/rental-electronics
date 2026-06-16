# System Test Cases Specification

This document details the test suites, verification matrices, and edge-case validations mapped to user actions and API contracts.

---

## 🖥️ Frontend User Action Test Cases

### Test Case 1: KYC Compliance Locking Protocol
- **Action**: Input customer email that is flagged as `'Rejected'` or `'Pending'` KYC status.
- **Expected UI Behavior**:
  - Immediate on-blur validation indicator highlights the email input box in red (`.input-error-state`).
  - Displays red helper text `.validation-error-text` with warning SVG icon: *"KYC Compliance Status must be Verified"*.
  - Displays a high-contrast warning banner: **"KYC COMPLIANCE LOCK ACTIVE"** detailing the account block.
  - The submit button "Lock Security Deposit" is completely disabled (`btn-disabled` class, cursor is `not-allowed`).

### Test Case 2: Intake Return Audit Camera Feed & AI Scan Mismatch
- **Action**: Service Technician opens the Return Desk, selects "Cracked Screen" damage, and captures/uploads a clean picture (no cracks).
- **Expected UI Behavior**:
  - The AI analysis simulator shows a pulsing indicator: *"AI Core analyzing structural asset integrity..."*
  - Within 2 seconds, the AI outputs a warning block: **"AI Verification Mismatch: Selected damage category does not align with visual evidence. Re-verify asset condition."** with a custom warning icon.
  - Submitting is flagged for manual supervisor clearance.

### Test Case 3: Due Today & Overdue Contact Dialer Activation
- **Action**: Manager navigates to "Due Today" list. It shows a list of overdue returns.
- **Expected UI Behavior**:
  - Overdue items are listed under a separate, dedicated section **"Overdue Returns"** with red status badge **"OVERDUE BY X DAYS"**.
  - Customer phone numbers are enclosed in a prominent blue-accented button block.
  - Clicking on the phone number triggers a `tel:` protocol launching the native dialer application immediately.

---

## 🗄️ Backend REST API Test Cases

| Test ID | Endpoint | Method | Payload / Input | Expected Status | Expected Output / Validation Response |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **API-01** | `/api/rentals` | `POST` | Valid rental intake payload (KYC Verified) | `201 Created` | `{ "success": true, "message": "Rental transaction initiated successfully.", "data": { ... } }` |
| **API-02** | `/api/rentals` | `POST` | Invalid phone payload (`+91-987-654` with hyphens) | `400 Bad Request` | `{ "success": false, "error": "\"userPhone\" must conform to standard international E.164 pattern" }` |
| **API-03** | `/api/rentals` | `POST` | Customer account with KYC `Rejected` | `403 Forbidden` | `{ "success": false, "error": "Verification Blocked: Assignment to unverified customer accounts is restricted..." }` |
| **API-04** | `/api/returns` | `POST` | Valid inspection payload (Water Damage selection) | `200 OK` | `{ "success": true, "message": "Asset return processed and inspection logged.", "data": { ..., "settlementStatus": "Under Review" } }` |
| **API-05** | `/api/settlements/:id` | `PATCH`| Final clearance payload (`paymentMethod` specified) | `200 OK` | `{ "success": true, "message": "Settlement finalized and remaining funds disbursed.", "status": "Settled" }` |
| **API-06** | `/api/rentals/:id/triage` | `PATCH`| Triage state toggle payload (`"status": "Isolated Repair"`) | `200 OK` | `{ "success": true, "status": "Isolated Repair" }` |
