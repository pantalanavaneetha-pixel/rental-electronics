// Dual-Driver Database Client Manager (PostgreSQL & SQLite Fallback)
// File: config/db.js

import pkg from 'pg';
const { Pool } = pkg;
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if we should use SQLite (default locally if no DB_HOST is configured)
const useSqlite = !process.env.DB_HOST;

let pool = null;
let sqliteDb = null;

if (useSqlite) {
  const dbPath = path.resolve(__dirname, '../../database.sqlite');
  console.log(`⚠️  No DB_HOST detected. Falling back to local SQLite database at: ${dbPath}`);
  
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening local SQLite database:', err.message);
    } else {
      console.log('✔ Connected to local SQLite database.');
    }
  });

  // Create tables if they do not exist (matching PostgreSQL schemas)
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        is_corporate INTEGER DEFAULT 0,
        kyc_status TEXT NOT NULL DEFAULT 'Verified',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Self-healing migration to ensure kyc_status exists on existing SQLite dbs
    sqliteDb.run("ALTER TABLE users ADD COLUMN kyc_status TEXT NOT NULL DEFAULT 'Verified'", (err) => {
      // Ignore errors if column is already present
    });

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        serial_number TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        base_cost REAL NOT NULL,
        status TEXT DEFAULT 'Available',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sqliteDb.run(`
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
      )
    `);

    sqliteDb.run(`
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
        settled_at TEXT
      )
    `);

    // Self-healing migration for photo_evidence_urls on claims table
    sqliteDb.run("ALTER TABLE claims ADD COLUMN photo_evidence_urls TEXT", (err) => {
      // Ignore error if column is already present
    });

    // Self-healing migration for customer_email on rentals table
    sqliteDb.run("ALTER TABLE rentals ADD COLUMN customer_email TEXT", (err) => {
      // Ignore error if column is already present
    });

    // Self-healing migration for days_overdue on claims table
    sqliteDb.run("ALTER TABLE claims ADD COLUMN days_overdue INTEGER DEFAULT 0", (err) => {
      // Ignore error if column is already present
    });

    // Self-healing migration for late_fee_charged on claims table
    sqliteDb.run("ALTER TABLE claims ADD COLUMN late_fee_charged REAL DEFAULT 0.00", (err) => {
      // Ignore error if column is already present
    });

    // Self-healing migration for settled_at on claims table
    sqliteDb.run("ALTER TABLE claims ADD COLUMN settled_at TEXT", (err) => {
      // Ignore error if column is already present
    });

    // Self-healing migration for settlement_status on claims table
    sqliteDb.run("ALTER TABLE claims ADD COLUMN settlement_status TEXT", (err) => {
      // Ignore error if column is already present
    });

    // Check if database needs seeding
    sqliteDb.get("SELECT COUNT(*) as count FROM rentals", (err, row) => {
      if (!err && row && row.count === 0) {
        console.log('Database empty. Seeding initial mock records for users, devices, rentals, and claims...');
        const now = new Date().toISOString();
        
        sqliteDb.serialize(() => {
          // 1. Seed Users
          sqliteDb.run(
            `INSERT INTO users (id, name, email, phone, is_corporate, kyc_status, created_at) VALUES 
             ('CUST-F8A3D9', 'Jane Smith', 'jane.smith@example.com', '+1-555-0199', 0, 'Verified', ?),
             ('CUST-E2B8C4', 'Priya Patel', 'priya.patel@example.com', '+91-98765-43210', 0, 'Pending', ?),
             ('CUST-D7F5E1', 'Amit Verma', 'amit.verma@example.com', '+91-99999-88888', 1, 'Rejected', ?)`,
            [now, now, now]
          );

          // 2. Seed Devices
          sqliteDb.run(
            `INSERT INTO devices (id, serial_number, category, base_cost, status) VALUES
             ('d1', 'SN-MBP3-999', 'MacBook Pro M3', 150000.00, 'Rented'),
             ('d2', 'SN-IPD4-888', 'iPad Pro M4', 80000.00, 'Rented'),
             ('d3', 'SN-IPH15-777', 'iPhone 15 Pro', 120000.00, 'Available')`
          );

          // 3. Seed Rentals
          sqliteDb.run(
            `INSERT INTO rentals (id, user_id, device_id, start_date, end_date, security_deposit, base_tariff, initial_condition_notes, status, created_at) VALUES
             ('RENT-G6H2Y9', 'CUST-F8A3D9', 'd1', '2026-06-01T12:00:00.000Z', '2026-06-15T12:00:00.000Z', 50000.00, 5000.00, 'Factory pristine condition.', 'Active', ?),
             ('RENT-M4K7N1', 'CUST-E2B8C4', 'd2', '2026-06-02T10:00:00.000Z', '2026-06-12T10:00:00.000Z', 15000.00, 2500.00, 'Minor scratch on back bezel.', 'Pending_Claim', ?),
             ('RENT-P8Q3S5', 'CUST-D7F5E1', 'd3', '2026-06-03T09:00:00.000Z', '2026-06-10T09:00:00.000Z', 25000.00, 3500.00, 'Brand new in box.', 'Settled', ?)`,
            [now, now, now]
          );

          // 4. Seed Claims (days_overdue and late_fee_charged default to 0 for mock data)
          sqliteDb.run(
            `INSERT INTO claims (id, rental_id, damage_description, severity_multiplier, deduction_amount, final_refund, days_overdue, late_fee_charged, payment_method, settlement_notes, settled_on) VALUES
             ('c1', 'RENT-M4K7N1', 'Cracked Screen (Severity: 1.0x)', 1.0, 12500.00, 2500.00, 0, 0.00, NULL, NULL, ?),
             ('c2', 'RENT-P8Q3S5', 'Body Dents (Severity: 1.0x)', 1.0, 4166.00, 20834.00, 0, 0.00, 'UPI Refund Transfer', 'Deduction applied for light chassis scratches.', ?)`,
            [now, now]
          );
        });
        console.log('✔ SQLite Database seeding completed successfully.');
      }
    });
  });

} else {
  console.log(`🔌 Production mode: Connecting to PostgreSQL database at ${process.env.DB_HOST}...`);
  const poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'electronics_rental',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX || '15', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '2000', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };

  pool = new Pool(poolConfig);

  pool.on('connect', () => {
    console.log('✔ PostgreSQL connection pool established.');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client:', err.message);
  });
}

/**
 * Standardized Query Helper
 * Translates PostgreSQL parameterized bindings ($1, $2) to SQLite format (?, ?) dynamically.
 */
export const query = (text, params = []) => {
  if (useSqlite) {
    // Find all $N parameters in the query in order of appearance
    const matches = text.match(/\$\d+/g);
    let sqliteParams = params;
    if (matches) {
      sqliteParams = matches.map(m => {
        const index = parseInt(m.substring(1), 10) - 1;
        return params[index];
      });
    }

    // Translate PG bindings ($1, $2) to SQLite bindings (?, ?)
    let translatedText = text.replace(/\$\d+/g, '?');
    
    // SQLite RETURNING clause compatibility fallback
    const hasReturning = /returning\s+\*/i.test(translatedText);
    if (hasReturning) {
      translatedText = translatedText.replace(/returning\s+\*/i, '');
    }

    return new Promise((resolve, reject) => {
      const isSelect = /^\s*select/i.test(translatedText);
      
      if (isSelect) {
        sqliteDb.all(translatedText, sqliteParams, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        sqliteDb.run(translatedText, sqliteParams, function (err) {
          if (err) {
            reject(err);
          } else {
            // If the query used RETURNING, fetch the row to match PG return format
            if (hasReturning) {
              const tableName = translatedText.match(/into\s+(\w+)/i)?.[1] || 
                                translatedText.match(/update\s+(\w+)/i)?.[1];
              if (tableName) {
                sqliteDb.get(`SELECT * FROM ${tableName} WHERE rowid = ?`, [this.lastID], (fetchErr, row) => {
                  if (fetchErr) reject(fetchErr);
                  else resolve({ rows: [row || { id: this.lastID }] });
                });
              } else {
                resolve({ rows: [{ id: this.lastID || this.changes }] });
              }
            } else {
              resolve({ rows: [{ id: this.lastID || this.changes }] });
            }
          }
        });
      }
    });
  } else {
    return pool.query(text, params);
  }
};

// Mock Pool wrapper to support connect() transactions in SQLite mode
const mockPool = {
  query: (text, params) => query(text, params),
  connect: async () => {
    return {
      query: (text, params) => query(text, params),
      release: () => {}
    };
  }
};

export default useSqlite ? mockPool : pool;
