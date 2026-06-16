import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database.sqlite');
console.log(`Initializing SQLite database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Setup tables
db.serialize(() => {
  // Create rentals table
  db.run(`
    CREATE TABLE IF NOT EXISTS rentals (
      rentalId TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      deviceModel TEXT NOT NULL,
      securityDepositHeld INTEGER NOT NULL,
      damageType TEXT DEFAULT 'None',
      damageDeduction INTEGER DEFAULT 0,
      photoEvidenceUrl TEXT DEFAULT '',
      settlementStatus TEXT DEFAULT 'Held',
      settlementAt TEXT,
      notes TEXT,
      paymentMethod TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // Create audit logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rentalId TEXT NOT NULL,
      actionType TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Check if rentals table is empty, and seed if true
  db.get('SELECT COUNT(*) as count FROM rentals', (err, row) => {
    if (err) {
      console.error('Error counting rentals:', err.message);
      return;
    }

    if (row.count === 0) {
      console.log('Database empty. Seeding initial mock records...');
      const now = new Date().toISOString();

      const seedRecords = [
        {
          rentalId: "REF-2026-001",
          customerName: "Jane Smith",
          deviceModel: "MacBook Pro M3",
          securityDepositHeld: 50000,
          damageType: "None",
          damageDeduction: 0,
          photoEvidenceUrl: "",
          settlementStatus: "Held",
          createdAt: now
        },
        {
          rentalId: "REF-2026-002",
          customerName: "Priya Patel",
          deviceModel: "iPad Pro M4",
          securityDepositHeld: 15000,
          damageType: "Cracked Screen",
          damageDeduction: 12500,
          photoEvidenceUrl: "https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=600",
          settlementStatus: "Under Review",
          createdAt: now
        },
        {
          rentalId: "REF-2026-003",
          customerName: "Amit Verma",
          deviceModel: "iPhone 15 Pro",
          securityDepositHeld: 25000,
          damageType: "Body Scratches / Dents",
          damageDeduction: 4166,
          photoEvidenceUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600",
          settlementStatus: "Settled",
          settlementAt: now,
          notes: "Deduction applied for light chassis scratches.",
          paymentMethod: "UPI Refund Transfer",
          createdAt: now
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO rentals (
          rentalId, customerName, deviceModel, securityDepositHeld, 
          damageType, damageDeduction, photoEvidenceUrl, settlementStatus, 
          settlementAt, notes, paymentMethod, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      seedRecords.forEach((r) => {
        stmt.run(
          r.rentalId,
          r.customerName,
          r.deviceModel,
          r.securityDepositHeld,
          r.damageType,
          r.damageDeduction,
          r.photoEvidenceUrl,
          r.settlementStatus,
          r.settlementAt || null,
          r.notes || null,
          r.paymentMethod || null,
          r.createdAt
        );
      });

      stmt.finalize(() => {
        console.log('Seeding rentals complete.');
      });

      // Seed corresponding audit logs
      const auditStmt = db.prepare(`
        INSERT INTO audit_logs (rentalId, actionType, description, timestamp)
        VALUES (?, ?, ?, ?)
      `);

      seedRecords.forEach((r) => {
        auditStmt.run(r.rentalId, 'INTAKE', `Security deposit of INR ${r.securityDepositHeld} authorized and registered.`, r.createdAt);
        if (r.settlementStatus === 'Under Review') {
          auditStmt.run(r.rentalId, 'INSPECTION', `Inspection filed. Damage: "${r.damageType}" assessed. Deduction: INR ${r.damageDeduction}.`, r.createdAt);
        } else if (r.settlementStatus === 'Settled') {
          auditStmt.run(r.rentalId, 'INSPECTION', `Inspection filed. Damage: "${r.damageType}" assessed. Deduction: INR ${r.damageDeduction}.`, r.createdAt);
          auditStmt.run(r.rentalId, 'SETTLEMENT', `Deposit finalized: captured INR ${r.damageDeduction}, released remaining via ${r.paymentMethod}.`, r.settlementAt);
        }
      });

      auditStmt.finalize(() => {
        console.log('Seeding audit logs complete.');
      });
    }
  });
});

export default db;
