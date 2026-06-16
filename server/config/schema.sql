-- Production PostgreSQL Schema for Electronics Rental Tracker
-- File: config/schema.sql

-- Enable UUID extension for unique primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_corporate BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'Laptop', 'Camera', 'Drone'
    base_cost NUMERIC(12, 2) NOT NULL CHECK (base_cost >= 0.00),
    status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'Rented', 'Maintenance', 'ISOLATED_REPAIR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Rentals table
CREATE TABLE IF NOT EXISTS rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    security_deposit NUMERIC(12, 2) NOT NULL CHECK (security_deposit > 0.00),
    base_tariff NUMERIC(12, 2) NOT NULL CHECK (base_tariff >= 0.00),
    initial_condition_notes TEXT,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending_Claim', 'Settled')),
    customer_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rental_dates CHECK (end_date > start_date)
);

-- 4. Claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL UNIQUE REFERENCES rentals(id) ON DELETE RESTRICT,
    damage_description TEXT NOT NULL,
    severity_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00 CHECK (severity_multiplier >= 0.00),
    deduction_amount NUMERIC(12, 2) NOT NULL CHECK (deduction_amount >= 0.00),
    final_refund NUMERIC(12, 2) NOT NULL CHECK (final_refund >= 0.00),
    days_overdue INT DEFAULT 0,
    late_fee_charged DECIMAL(10, 2) DEFAULT 0.00,
    payment_method VARCHAR(255),
    settlement_notes TEXT,
    photo_evidence_urls TEXT,
    settled_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP WITH TIME ZONE,
    settlement_status VARCHAR(50) DEFAULT NULL
);

-- Indexes to optimize foreign key lookups and queries
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_device_id ON rentals(device_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_claims_rental_id ON claims(rental_id);
CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category);
