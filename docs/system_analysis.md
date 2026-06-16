# System Analysis & Design Specification

This document outlines the frontend modules, user flow diagrams, backend data lifecycle, and system transactional sequences for the **RentShield CC** platform.

---

## 🖥️ Frontend Modules & User Flow Analysis

### 1. Key Operational Modules
- **Intake Form (Deposit Management)**:
  - Registers customer profiles, verifies KYC status, locks a custom security deposit, and issues a specific serial number to the customer.
- **Return Checklist & Intake Desk**:
  - Handles customer returns. Includes webcam streaming and photo uploads for physical verification, days-left indicators, and late return daily fee computations.
- **AI Damage Selector & Triage**:
  - Integrates computer-vision simulation matching captured images with selected damage categories (e.g. cracked screens, fluid intrusion, dents). Triggers an urgent technician triage protocol for critical states (such as Water Damage).
- **Settlement & Ledger Summary**:
  - Details the financial reconciliation. Calculates deductions, issues net payouts (refunds) or invoice deficits, logs settlement notes, and generates PDF receipts.

### 2. User Flow Diagram (Navigating from Return to Settlement)

```mermaid
graph TD
    A[Start Return] --> B[Enter Rental ID / Search Records]
    B --> C[Validate Lease Status]
    C --> D[Return Desk: Select Physical Damage Condition]
    D --> E[Webcam / Photo Evidence Upload]
    E --> F[AI Scan Verification]
    F -- "Match" --> G[Calculate Deductions & Late Fees]
    F -- "Mismatch" --> H[Technician Flags Override / Review]
    H --> G
    G --> I[Submit Return Form]
    I --> J[Open Audits / Accounts Clearance]
    J --> K[Reconciliation Payout / Invoice Generation]
    K --> L[Download PDF Receipt & Release Funds]
```

---

## 🗄️ Backend Data Lifecycle & Sequence of Events

### 1. Relational Database Schema Mapping
The system tracks transactions across five primary tables:
- **`users`**: Contains customer identities, contact numbers, email addresses, and compliance statuses (`Verified`, `Pending`, `Rejected`).
- **`devices`**: Tracks asset serial numbers, model categories, hardware base values, and availability states (`Available`, `Rented`).
- **`rentals`**: Logs active leases, linking users to devices. Includes starting date, scheduled return date, locked security deposit held, and tracking state (`Active` / `'Held'`, `Pending_Claim` / `'Under Review'`, `Priority_Repair` / `'Isolated Repair'`, `Closed` / `'Settled'`).
- **`claims`**: Finalizes returns. Stores physical damage descriptions, severity damage deductions, overdue late fees, net refund totals, and payment methods.
- **`audit_logs`**: Logs step-by-step history of intakes, inspections, overrides, and financial clearances.

### 2. System Sequence Diagram (Data Event Loop)

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    actor Tech as Service Technician
    actor Accounts as Accounts Staff
    participant Server as Express API
    participant DB as Dual-Driver Database

    Customer->>Server: 1. Intake: Locks Deposit & Receives Asset
    Server->>DB: Save User, Set Device status='Rented', Set Rental status='Active'
    
    Note over Customer, Tech: Rental Lease Duration Runs
    
    Customer->>Tech: 2. Return: Hands over device
    Tech->>Server: Captures evidence, runs AI inspector, Submits Return Form
    Server->>DB: Set Device status='Available', Set Rental status='Pending_Claim', Insert Audit Log

    Accounts->>Server: 3. Audit: Inspects claims ledger
    Server->>DB: Fetch Claim details & late fee calculations
    Accounts->>Server: 4. Finalize: Authorizes payout (payout/deficit)
    Server->>DB: Set Rental status='Closed', Insert claim reconciliation, Insert Audit Log
    Server-->>Accounts: 5. Return status code & generates PDF receipt
```
