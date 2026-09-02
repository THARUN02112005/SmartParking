import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'parking.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'USER' CHECK(role IN ('USER', 'ADMIN')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      vehicleNumber TEXT NOT NULL,
      vehicleType TEXT NOT NULL CHECK(vehicleType IN ('CAR', 'BIKE', 'EV_CAR', 'EV_BIKE')),
      model TEXT,
      color TEXT,
      isEV INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parking_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      zoneType TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS parking_slots (
      id TEXT PRIMARY KEY,
      zoneId TEXT NOT NULL REFERENCES parking_zones(id),
      slotNumber TEXT NOT NULL,
      slotType TEXT NOT NULL CHECK(slotType IN ('STANDARD', 'COMPACT', 'EV', 'PREMIUM', 'HANDICAP')),
      status TEXT DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'BLOCKED', 'MAINTENANCE')),
      positionX INTEGER NOT NULL,
      positionY INTEGER NOT NULL,
      priority INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      vehicleId TEXT NOT NULL REFERENCES vehicles(id),
      slotId TEXT NOT NULL REFERENCES parking_slots(id),
      startTime TEXT NOT NULL,
      expiryTime TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'COMPLETED'))
    );

    CREATE TABLE IF NOT EXISTS parking_sessions (
      id TEXT PRIMARY KEY,
      vehicleId TEXT NOT NULL,
      userId TEXT,
      slotId TEXT,
      entryTime TEXT NOT NULL,
      exitTime TEXT,
      duration REAL,
      fee REAL,
      paymentStatus TEXT DEFAULT 'PENDING' CHECK(paymentStatus IN ('PENDING', 'PAID', 'FAILED', 'WAIVED')),
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))
    );

    CREATE TABLE IF NOT EXISTS simulation_vehicles (
      id TEXT PRIMARY KEY,
      vehicleId TEXT NOT NULL,
      vehicleType TEXT NOT NULL,
      currentPositionX REAL NOT NULL,
      currentPositionY REAL NOT NULL,
      rotation REAL DEFAULT 0,
      targetSlot TEXT,
      movementStatus TEXT DEFAULT 'IDLE' CHECK(movementStatus IN ('IDLE', 'MOVING', 'PARKING', 'PARKED', 'ENTERING', 'EXITING')),
      color TEXT,
      vehicleNumber TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_recommendations (
      id TEXT PRIMARY KEY,
      vehicleId TEXT NOT NULL,
      recommendedSlot TEXT NOT NULL,
      recommendationScore REAL NOT NULL,
      reason TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS violations (
      id TEXT PRIMARY KEY,
      vehicleId TEXT NOT NULL,
      violationType TEXT NOT NULL,
      slotId TEXT,
      severity TEXT DEFAULT 'LOW' CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      description TEXT,
      createdAt TEXT NOT NULL,
      resolved INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('INFO', 'WARNING', 'ALERT', 'SUCCESS', 'PAYMENT')),
      isRead INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pricing (
      id TEXT PRIMARY KEY,
      vehicleType TEXT NOT NULL UNIQUE,
      pricePerHour REAL NOT NULL,
      minimumFee REAL DEFAULT 0
    );
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_vehicles_userId ON vehicles(userId);
    CREATE INDEX IF NOT EXISTS idx_vehicles_vehicleNumber ON vehicles(vehicleNumber);
    CREATE INDEX IF NOT EXISTS idx_parking_slots_zoneId ON parking_slots(zoneId);
    CREATE INDEX IF NOT EXISTS idx_parking_slots_status ON parking_slots(status);
    CREATE INDEX IF NOT EXISTS idx_reservations_userId ON reservations(userId);
    CREATE INDEX IF NOT EXISTS idx_reservations_slotId ON reservations(slotId);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
    CREATE INDEX IF NOT EXISTS idx_parking_sessions_vehicleId ON parking_sessions(vehicleId);
    CREATE INDEX IF NOT EXISTS idx_parking_sessions_userId ON parking_sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_parking_sessions_status ON parking_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_simulation_vehicles_vehicleId ON simulation_vehicles(vehicleId);
    CREATE INDEX IF NOT EXISTS idx_violations_vehicleId ON violations(vehicleId);
    CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
    CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications(isRead);
    CREATE INDEX IF NOT EXISTS idx_pricing_vehicleType ON pricing(vehicleType);
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
