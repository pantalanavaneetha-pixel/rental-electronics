-- Migration Script to update Database Columns
-- File: server/config/migration.sql

-- 1. In rentals table, add customer_email
ALTER TABLE rentals ADD COLUMN customer_email VARCHAR(255);

-- 2. In claims (damage_claims) table, add days_overdue, late_fee_charged, settled_at, and settlement_status
ALTER TABLE claims ADD COLUMN days_overdue INT DEFAULT 0;
ALTER TABLE claims ADD COLUMN late_fee_charged DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE claims ADD COLUMN settled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE claims ADD COLUMN settlement_status VARCHAR(50) DEFAULT NULL;

-- 3. In devices (inventory_devices) table, update status check constraint to support 'ISOLATED_REPAIR'
-- For PostgreSQL:
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;
ALTER TABLE devices ADD CONSTRAINT devices_status_check CHECK (status IN ('Available', 'Rented', 'Maintenance', 'ISOLATED_REPAIR'));
