# Database Design & Core Logic Planning

This document details the Entity-Relationship (ER) model, exact SQL schemas, and schema validation test plans for the **RentShield CC** dual-driver database engine.

---

## 📊 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ rentals : places
    devices ||--o{ rentals : assigned_to
    rentals ||--o| claims : has_one
    rentals ||--o{ audit_logs : triggers

    users {
        string id PK
        string name
        string email UNIQUE
        string phone
        integer is_corporate
        string kyc_status
        string created_at
    }

    devices {
        string id PK
        string serial_number UNIQUE
        string category
        real base_cost
        string status
        string created_at
    }

    rentals {
        string id PK
        string user_id FK
        string device_id FK
        string start_date
        string end_date
        real security_deposit
        real base_tariff
        string initial_condition_notes
        string status
        string customer_email
        string created_at
    }

    claims {
        string id PK
        string rental_id FK UNIQUE
        string damage_description
        real severity_multiplier
        real deduction_amount
        real final_refund
        integer days_overdue
        real late_fee_charged
        string payment_method
        string settlement_notes
        string photo_evidence_urls
        string settled_on
        string settled_at
        string settlement_status
    }

    audit_logs {
        integer id PK
        string rental_id FK
        string action_type
        string description
        string timestamp
    }
```

---

## 🗄️ Database Table Schemas

### 1. Customers (`users`)
Holds client identities, E.164 phone details, and compliance locking indicators.
```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    is_corporate INTEGER DEFAULT 0,
    kyc_status TEXT NOT NULL DEFAULT 'Verified',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Device Registry (`devices`)
Stores device serial configurations and availability status.
```sql
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    serial_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    base_cost REAL NOT NULL,
    status TEXT DEFAULT 'Available',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Leases (`rentals`)
Connects users to assigned hardware resources during their lease term.
```sql
CREATE TABLE IF NOT EXISTS rentals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    device_id TEXT NOT NULL REFERENCES devices(id),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    security_deposit REAL NOT NULL,
    base_tariff REAL NOT NULL,
    initial_condition_notes TEXT,
    status TEXT DEFAULT 'Active',
    customer_email TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Returns Audit & Settlements (`claims`)
Finalizes returns, physical repair deductions, and penalty calculations.
```sql
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    rental_id TEXT NOT NULL UNIQUE REFERENCES rentals(id),
    damage_description TEXT NOT NULL,
    severity_multiplier REAL NOT NULL,
    deduction_amount REAL NOT NULL,
    final_refund REAL NOT NULL,
    days_overdue INTEGER NOT NULL DEFAULT 0,
    late_fee_charged REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    settlement_notes TEXT,
    photo_evidence_urls TEXT,
    settled_on TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TEXT,
    settlement_status TEXT
);
```

---

## 🧪 Database Validation & Data Type Test Plan

To prevent corrupted financial registries, the following validations are executed in backend schemas and controllers before writing transactions:

| Table | Field Name | Target Data Type | Constraints & Validation Logic | Type Check Failure Test Case |
| :--- | :--- | :--- | :--- | :--- |
| **`claims`** | `deduction_amount` | `REAL` / `NUMERIC` | Must be a positive floating-point number $\ge 0$. Cannot exceed `security_deposit`. | Try inserting a string `"five thousand"` or negative value `-1200`. Backend must trigger validation schema error. |
| **`claims`** | `days_overdue` | `INTEGER` | Must be an integer $\ge 0$. | Insert decimal value `1.5` overdue days. System must round/cast or reject the request. |
| **`rentals`**| `security_deposit` | `REAL` / `NUMERIC` | Must be $\ge 0$. | Insert empty string `""` or invalid NaN. DB block triggers standard SQL constraints rejection. |
| **`users`**  | `kyc_status` | `TEXT` | Must be one of `Verified`, `Pending`, `Rejected`. | Attempt to write `"Approved"`. Validation fails under pre-defined enum constraints. |
