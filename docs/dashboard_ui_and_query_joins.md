# Dynamic Dashboard UI & Database Joins Optimization

This document records the frontend layout, backend database join queries, and responsiveness test logs for **Day 8** of the project.

---

## 🖥️ Frontend Dashboard Architecture
The Asset Operations Dashboard is implemented inside [Dashboard.jsx](file:///c:/Users/panta/OneDrive/Desktop/Rental%20Electronics%20and%20damage%20settlement/src/views/Dashboard.jsx) and features:
- **Top Metrics Row (`SummaryCard` Component)**:
  - **Total Monitored Deposits**: Sums up all locked security deposits across active leases.
  - **Active Incidents**: Counts rentals with damage types other than `'None'`.
  - **Open Audits**: Counts rentals in `'Under Review'` or `'Isolated Repair'` status.
  - **Due Today**: Counts active leases scheduled for return today or overdue.
- **Central Data Ledger**: A clean, high-contrast table displaying individual rental records with columns for Rental ID, Customer Name, and status badges.

---

## 🗄️ Backend Query Joins & Optimizations
To avoid the $N+1$ query problem, the `listRentals` controller fetches complete data in a single transactional query by performing relational table joins:

```sql
SELECT 
    r.id AS "rentalId",
    CASE r.status 
        WHEN 'Active' THEN 'Held' 
        WHEN 'Pending_Claim' THEN 'Under Review'
        WHEN 'Priority_Repair' THEN 'Isolated Repair'
        ELSE r.status 
    END AS "settlementStatus",
    r.start_date AS "startDate",
    r.end_date AS "endDate",
    r.security_deposit AS "securityDepositHeld",
    r.base_tariff AS "baseTariff",
    COALESCE(c.settlement_notes, r.initial_condition_notes) AS "notes",
    u.name AS "customerName",
    u.email AS "customerEmail",
    u.phone AS "customerPhone",
    u.id AS "customerId",
    u.kyc_status AS "kycStatus",
    d.serial_number AS "deviceSerial",
    d.category AS "deviceCategory",
    d.category AS "deviceModel",
    COALESCE(c.damage_description, 'None') AS "damageType",
    COALESCE(c.photo_evidence_urls, '') AS "photoEvidenceUrl",
    COALESCE(c.deduction_amount, 0) AS "damageDeduction",
    COALESCE(c.days_overdue, 0) AS "daysOverdue",
    COALESCE(c.late_fee_charged, 0) AS "lateFeeCharged",
    c.payment_method AS "paymentMethod",
    c.settled_on AS "settlementAt"
FROM rentals r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN devices d ON r.device_id = d.id
LEFT JOIN claims c ON r.id = c.rental_id;
```
- **Indexes**: Ensures foreign keys (`user_id`, `device_id`) and unique constraint columns have default B-tree indexes in SQLite/PostgreSQL to optimize join lookup cycles.

---

## 📡 Responsive UI Verification Logs

To verify that columns do not break or overlap across form factors, we tested the dashboard layout:

### 1. Large Laptop / Desktop Screens ($\ge 1024\text{px}$)
- **Behavior**: Metric cards render side-by-side in a 4-column grid (`.grid-4`). Data table displays full details without truncation. Sidebar navigation remains docked on the left.

### 2. Tablet / Small Laptop Screens ($768\text{px} - 1023\text{px}$)
- **Behavior**: The metrics grid automatically adjusts column widths. Data table wraps email addresses and shrinks spacing to fit the viewport width without overlap.

### 3. Mobile Screens ($< 768\text{px}$)
- **Behavior**:
  - The metrics grid wraps to vertical layout or 2-column cards.
  - The sidebar navigation hides behind a top mobile header bar with a menu button (`☰` and `✕`). Backdrop overlays are enabled for smooth accessibility.
  - Data table is wrapped in an overflow container (`.table-container` with `overflow-x: auto`) allowing smooth horizontal swipe navigation without breaking main body container alignments.
