import { getDb, closeDb } from './database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export function seed() {
  const db = getDb();

  console.log('Clearing existing data...');
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM violations;
    DELETE FROM ai_recommendations;
    DELETE FROM simulation_vehicles;
    DELETE FROM parking_sessions;
    DELETE FROM reservations;
    DELETE FROM parking_slots;
    DELETE FROM parking_zones;
    DELETE FROM vehicles;
    DELETE FROM users;
    DELETE FROM pricing;
  `);

  const now = new Date().toISOString();
  const daysAgo = (d: number) => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date.toISOString();
  };
  const hoursAgo = (h: number) => {
    const date = new Date();
    date.setHours(date.getHours() - h);
    return date.toISOString();
  };
  const hoursFromNow = (h: number) => {
    const date = new Date();
    date.setHours(date.getHours() + h);
    return date.toISOString();
  };

  // ========== USERS ==========
  console.log('Creating users...');
  const adminId = uuidv4();
  const userId1 = uuidv4();
  const userId2 = uuidv4();
  const userId3 = uuidv4();

  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash = bcrypt.hashSync('password123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, phone, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(adminId, 'Admin User', 'admin@smartparking.com', adminHash, '+91-9876543210', 'ADMIN', daysAgo(30), now);
  insertUser.run(userId1, 'Rahul Sharma', 'rahul@example.com', userHash, '+91-9876543211', 'USER', daysAgo(25), now);
  insertUser.run(userId2, 'Priya Patel', 'priya@example.com', userHash, '+91-9876543212', 'USER', daysAgo(20), now);
  insertUser.run(userId3, 'Amit Kumar', 'amit@example.com', userHash, '+91-9876543213', 'USER', daysAgo(15), now);

  // ========== VEHICLES ==========
  console.log('Creating vehicles...');
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (id, userId, vehicleNumber, vehicleType, model, color, isEV, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const vehicles = [
    { id: uuidv4(), userId: userId1, number: 'MH-12-AB-1234', type: 'CAR', model: 'Maruti Swift', color: '#3B82F6', isEV: 0 },
    { id: uuidv4(), userId: userId1, number: 'MH-12-CD-5678', type: 'EV_CAR', model: 'Tata Nexon EV', color: '#00D2FF', isEV: 1 },
    { id: uuidv4(), userId: userId2, number: 'KA-01-EF-9012', type: 'BIKE', model: 'Royal Enfield Classic', color: '#FF6B35', isEV: 0 },
    { id: uuidv4(), userId: userId2, number: 'KA-01-GH-3456', type: 'CAR', model: 'Hyundai Creta', color: '#EF4444', isEV: 0 },
    { id: uuidv4(), userId: userId3, number: 'TN-09-IJ-7890', type: 'EV_BIKE', model: 'Ather 450X', color: '#FFD700', isEV: 1 },
    { id: uuidv4(), userId: userId3, number: 'TN-09-KL-2345', type: 'CAR', model: 'Kia Seltos', color: '#10B981', isEV: 0 },
    { id: uuidv4(), userId: userId1, number: 'DL-03-MN-6789', type: 'BIKE', model: 'KTM Duke 390', color: '#004E89', isEV: 0 },
    { id: uuidv4(), userId: userId2, number: 'DL-03-OP-0123', type: 'EV_CAR', model: 'MG ZS EV', color: '#00F5A0', isEV: 1 },
    { id: uuidv4(), userId: userId3, number: 'MH-14-QR-4567', type: 'CAR', model: 'Toyota Fortuner', color: '#F59E0B', isEV: 0 },
    { id: uuidv4(), userId: userId1, number: 'MH-14-ST-8901', type: 'EV_CAR', model: 'Hyundai Ioniq 5', color: '#7B68EE', isEV: 1 },
  ];

  for (const v of vehicles) {
    insertVehicle.run(v.id, v.userId, v.number, v.type, v.model, v.color, v.isEV, daysAgo(Math.floor(Math.random() * 20) + 5));
  }

  // ========== PARKING ZONES ==========
  console.log('Creating parking zones...');
  const insertZone = db.prepare(`
    INSERT INTO parking_zones (id, name, description, zoneType, color) VALUES (?, ?, ?, ?, ?)
  `);

  const zoneA = uuidv4();
  const zoneB = uuidv4();
  const zoneC = uuidv4();
  const zoneD = uuidv4();

  insertZone.run(zoneA, 'Zone A - Cars', 'Standard car parking area with 2 rows', 'STANDARD', '#3B82F6');
  insertZone.run(zoneB, 'Zone B - Bikes', 'Two-wheeler parking zone', 'COMPACT', '#FF6B35');
  insertZone.run(zoneC, 'Zone C - EV Charging', 'Electric vehicle charging stations', 'EV', '#10B981');
  insertZone.run(zoneD, 'Zone D - Premium', 'Premium reserved parking with extra space', 'PREMIUM', '#F59E0B');

  // ========== PARKING SLOTS ==========
  console.log('Creating parking slots...');
  const insertSlot = db.prepare(`
    INSERT INTO parking_slots (id, zoneId, slotNumber, slotType, status, positionX, positionY, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Zone A: 12 car slots in 2-row layout
  const zoneASlots: Array<{ number: string; status: string; x: number; y: number; priority: number }> = [
    { number: 'A-01', status: 'OCCUPIED', x: 8, y: 8, priority: 0 },
    { number: 'A-02', status: 'OCCUPIED', x: 10, y: 8, priority: 0 },
    { number: 'A-03', status: 'AVAILABLE', x: 12, y: 8, priority: 0 },
    { number: 'A-04', status: 'AVAILABLE', x: 14, y: 8, priority: 0 },
    { number: 'A-05', status: 'OCCUPIED', x: 16, y: 8, priority: 0 },
    { number: 'A-06', status: 'AVAILABLE', x: 8, y: 12, priority: 0 },
    { number: 'A-07', status: 'RESERVED', x: 10, y: 12, priority: 0 },
    { number: 'A-08', status: 'AVAILABLE', x: 12, y: 12, priority: 0 },
    { number: 'A-09', status: 'OCCUPIED', x: 14, y: 12, priority: 0 },
    { number: 'A-10', status: 'AVAILABLE', x: 16, y: 12, priority: 0 },
    { number: 'A-11', status: 'BLOCKED', x: 18, y: 8, priority: 0 },
    { number: 'A-12', status: 'AVAILABLE', x: 18, y: 12, priority: 0 },
  ];

  for (const slot of zoneASlots) {
    insertSlot.run(uuidv4(), zoneA, slot.number, 'STANDARD', slot.status, slot.x, slot.y, slot.priority);
  }

  // Zone B: 8 bike slots
  const zoneBSlots: Array<{ number: string; status: string; x: number; y: number; priority: number }> = [
    { number: 'B-01', status: 'OCCUPIED', x: 20, y: 8, priority: 0 },
    { number: 'B-02', status: 'AVAILABLE', x: 22, y: 8, priority: 0 },
    { number: 'B-03', status: 'AVAILABLE', x: 20, y: 12, priority: 0 },
    { number: 'B-04', status: 'OCCUPIED', x: 22, y: 12, priority: 0 },
    { number: 'B-05', status: 'AVAILABLE', x: 24, y: 8, priority: 0 },
    { number: 'B-06', status: 'AVAILABLE', x: 24, y: 12, priority: 0 },
    { number: 'B-07', status: 'RESERVED', x: 26, y: 8, priority: 0 },
    { number: 'B-08', status: 'AVAILABLE', x: 26, y: 12, priority: 0 },
  ];

  for (const slot of zoneBSlots) {
    insertSlot.run(uuidv4(), zoneB, slot.number, 'COMPACT', slot.status, slot.x, slot.y, slot.priority);
  }

  // Zone C: 6 EV slots
  const zoneCSlots: Array<{ number: string; status: string; x: number; y: number; priority: number }> = [
    { number: 'C-01', status: 'OCCUPIED', x: 8, y: 2, priority: 1 },
    { number: 'C-02', status: 'AVAILABLE', x: 10, y: 2, priority: 1 },
    { number: 'C-03', status: 'AVAILABLE', x: 12, y: 2, priority: 1 },
    { number: 'C-04', status: 'OCCUPIED', x: 14, y: 2, priority: 1 },
    { number: 'C-05', status: 'AVAILABLE', x: 16, y: 2, priority: 1 },
    { number: 'C-06', status: 'AVAILABLE', x: 18, y: 2, priority: 1 },
  ];

  for (const slot of zoneCSlots) {
    insertSlot.run(uuidv4(), zoneC, slot.number, 'EV', slot.status, slot.x, slot.y, slot.priority);
  }

  // Zone D: 6 premium/reserved slots
  const zoneDSlots: Array<{ number: string; status: string; x: number; y: number; priority: number }> = [
    { number: 'D-01', status: 'AVAILABLE', x: 20, y: 2, priority: 2 },
    { number: 'D-02', status: 'RESERVED', x: 22, y: 2, priority: 2 },
    { number: 'D-03', status: 'AVAILABLE', x: 24, y: 2, priority: 2 },
    { number: 'D-04', status: 'AVAILABLE', x: 20, y: 5, priority: 2 },
    { number: 'D-05', status: 'AVAILABLE', x: 22, y: 5, priority: 2 },
    { number: 'D-06', status: 'MAINTENANCE', x: 24, y: 5, priority: 2 },
  ];

  for (const slot of zoneDSlots) {
    insertSlot.run(uuidv4(), zoneD, slot.number, 'PREMIUM', slot.status, slot.x, slot.y, slot.priority);
  }

  // Get slot IDs for reference
  const allSlots = db.prepare(`SELECT id, slotNumber, status FROM parking_slots ORDER BY slotNumber`).all() as Array<{ id: string; slotNumber: string; status: string }>;
  const slotMap = new Map(allSlots.map(s => [s.slotNumber, s]));

  // ========== PRICING ==========
  console.log('Creating pricing...');
  const insertPricing = db.prepare(`
    INSERT INTO pricing (id, vehicleType, pricePerHour, minimumFee) VALUES (?, ?, ?, ?)
  `);

  insertPricing.run(uuidv4(), 'CAR', 30, 10);
  insertPricing.run(uuidv4(), 'BIKE', 15, 5);
  insertPricing.run(uuidv4(), 'EV_CAR', 25, 10);
  insertPricing.run(uuidv4(), 'EV_BIKE', 10, 5);

  // ========== RESERVATIONS ==========
  console.log('Creating reservations...');
  const insertReservation = db.prepare(`
    INSERT INTO reservations (id, userId, vehicleId, slotId, startTime, expiryTime, status) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const reservedSlotA07 = slotMap.get('A-07');
  const reservedSlotB07 = slotMap.get('B-07');
  const reservedSlotD02 = slotMap.get('D-02');

  if (reservedSlotA07) {
    insertReservation.run(uuidv4(), userId1, vehicles[0].id, reservedSlotA07.id, now, hoursFromNow(3), 'ACTIVE');
  }
  if (reservedSlotB07) {
    insertReservation.run(uuidv4(), userId2, vehicles[2].id, reservedSlotB07.id, now, hoursFromNow(2), 'ACTIVE');
  }
  if (reservedSlotD02) {
    insertReservation.run(uuidv4(), userId3, vehicles[8].id, reservedSlotD02.id, daysAgo(1), hoursFromNow(1), 'ACTIVE');
  }

  // ========== PARKING SESSIONS ==========
  console.log('Creating parking sessions...');
  const insertSession = db.prepare(`
    INSERT INTO parking_sessions (id, vehicleId, userId, slotId, entryTime, exitTime, duration, fee, paymentStatus, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Active sessions for currently parked vehicles
  const occupiedSlots = allSlots.filter(s => s.status === 'OCCUPIED');
  const sessionVehiclePairs = [
    { vehicleIdx: 0, slotNumber: 'A-01' },
    { vehicleIdx: 3, slotNumber: 'A-02' },
    { vehicleIdx: 8, slotNumber: 'A-05' },
    { vehicleIdx: 5, slotNumber: 'A-09' },
    { vehicleIdx: 2, slotNumber: 'B-01' },
    { vehicleIdx: 6, slotNumber: 'B-04' },
    { vehicleIdx: 1, slotNumber: 'C-01' },
    { vehicleIdx: 7, slotNumber: 'C-04' },
  ];

  for (const pair of sessionVehiclePairs) {
    const slot = slotMap.get(pair.slotNumber);
    if (slot) {
      insertSession.run(
        uuidv4(),
        vehicles[pair.vehicleIdx].id,
        vehicles[pair.vehicleIdx].userId,
        slot.id,
        hoursAgo(1 + Math.floor(Math.random() * 4)),
        null, null, null,
        'PENDING',
        'ACTIVE'
      );
    }
  }

  // Historical completed sessions for analytics
  for (let d = 1; d <= 14; d++) {
    const sessionCount = 3 + Math.floor(Math.random() * 5);
    for (let s = 0; s < sessionCount; s++) {
      const vIdx = Math.floor(Math.random() * vehicles.length);
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - d);
      entryDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      const duration = 0.5 + Math.random() * 4;
      const exitDate = new Date(entryDate.getTime() + duration * 60 * 60 * 1000);

      const vType = vehicles[vIdx].type;
      let pricePerHour = 30;
      if (vType === 'BIKE') pricePerHour = 15;
      else if (vType === 'EV_CAR') pricePerHour = 25;
      else if (vType === 'EV_BIKE') pricePerHour = 10;
      const fee = Math.round(duration * pricePerHour * 100) / 100;

      insertSession.run(
        uuidv4(),
        vehicles[vIdx].id,
        vehicles[vIdx].userId,
        allSlots[Math.floor(Math.random() * allSlots.length)].id,
        entryDate.toISOString(),
        exitDate.toISOString(),
        Math.round(duration * 100) / 100,
        fee,
        'PAID',
        'COMPLETED'
      );
    }
  }

  // ========== VIOLATIONS ==========
  console.log('Creating violations...');
  const insertViolation = db.prepare(`
    INSERT INTO violations (id, vehicleId, violationType, slotId, severity, description, createdAt, resolved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const violationData = [
    { vehicleId: vehicles[2].id, type: 'UNAUTHORIZED_PARKING', severity: 'MEDIUM', desc: 'Bike parked in car-only zone', resolved: 1 },
    { vehicleId: vehicles[6].id, type: 'OVERSTAY', severity: 'HIGH', desc: 'Vehicle exceeded 8-hour parking limit', resolved: 0 },
    { vehicleId: vehicles[4].id, type: 'WRONG_SLOT', severity: 'LOW', desc: 'EV bike parked in non-EV slot', resolved: 1 },
    { vehicleId: vehicles[8].id, type: 'BLOCKING', severity: 'CRITICAL', desc: 'Vehicle blocking emergency exit route', resolved: 0 },
    { vehicleId: vehicles[3].id, type: 'NO_PAYMENT', severity: 'MEDIUM', desc: 'Vehicle attempted to leave without payment', resolved: 0 },
  ];

  for (const v of violationData) {
    insertViolation.run(
      uuidv4(),
      v.vehicleId,
      v.type,
      allSlots[Math.floor(Math.random() * allSlots.length)].id,
      v.severity,
      v.desc,
      hoursAgo(Math.floor(Math.random() * 72) + 1),
      v.resolved
    );
  }

  // ========== NOTIFICATIONS ==========
  console.log('Creating notifications...');
  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const notificationData = [
    { userId: userId1, title: 'Welcome!', message: 'Welcome to Smart Parking System', type: 'INFO', isRead: 1 },
    { userId: userId1, title: 'Reservation Confirmed', message: 'Your reservation for slot A-07 has been confirmed', type: 'SUCCESS', isRead: 0 },
    { userId: userId2, title: 'Payment Reminder', message: 'Please complete payment for your parking session', type: 'PAYMENT', isRead: 0 },
    { userId: userId3, title: 'Slot Available', message: 'Your reserved slot D-02 is now ready', type: 'INFO', isRead: 0 },
    { userId: userId1, title: 'EV Charging Complete', message: 'Your vehicle in slot C-01 has finished charging', type: 'SUCCESS', isRead: 1 },
    { userId: userId2, title: 'Parking Fee', message: 'Parking fee of ₹150 has been charged for your recent visit', type: 'PAYMENT', isRead: 1 },
    { userId: adminId, title: 'System Alert', message: 'Zone A has high occupancy rate (83%)', type: 'ALERT', isRead: 0 },
    { userId: adminId, title: 'Violation Detected', message: 'Blocking violation detected in Zone A', type: 'WARNING', isRead: 0 },
    { userId: userId3, title: 'Expiry Warning', message: 'Your parking session will expire in 30 minutes', type: 'WARNING', isRead: 0 },
    { userId: userId1, title: 'Monthly Report', message: 'Your monthly parking report is ready for download', type: 'INFO', isRead: 0 },
  ];

  for (const n of notificationData) {
    insertNotification.run(uuidv4(), n.userId, n.title, n.message, n.type, n.isRead, hoursAgo(Math.floor(Math.random() * 48) + 1));
  }

  // ========== SUMMARY ==========
  const stats = {
    users: db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number },
    vehicles: db.prepare(`SELECT COUNT(*) as c FROM vehicles`).get() as { c: number },
    zones: db.prepare(`SELECT COUNT(*) as c FROM parking_zones`).get() as { c: number },
    slots: db.prepare(`SELECT COUNT(*) as c FROM parking_slots`).get() as { c: number },
    sessions: db.prepare(`SELECT COUNT(*) as c FROM parking_sessions`).get() as { c: number },
    reservations: db.prepare(`SELECT COUNT(*) as c FROM reservations`).get() as { c: number },
    violations: db.prepare(`SELECT COUNT(*) as c FROM violations`).get() as { c: number },
    notifications: db.prepare(`SELECT COUNT(*) as c FROM notifications`).get() as { c: number },
  };

  console.log('\n✅ Seed data created successfully!');
  console.log('─'.repeat(40));
  console.log(`👤 Users:            ${stats.users.c}`);
  console.log(`🚗 Vehicles:         ${stats.vehicles.c}`);
  console.log(`📍 Parking Zones:    ${stats.zones.c}`);
  console.log(`🅿️  Parking Slots:    ${stats.slots.c}`);
  console.log(`📝 Sessions:         ${stats.sessions.c}`);
  console.log(`📅 Reservations:     ${stats.reservations.c}`);
  console.log(`⚠️  Violations:       ${stats.violations.c}`);
  console.log(`🔔 Notifications:    ${stats.notifications.c}`);
  console.log('─'.repeat(40));
  console.log('\n🔑 Admin Login:');
  console.log('   Email: admin@smartparking.com');
  console.log('   Password: admin123');
  console.log('\n👤 User Logins:');
  console.log('   rahul@example.com / password123');
  console.log('   priya@example.com / password123');
  console.log('   amit@example.com  / password123\n');
}

export function runSeed() {
  seed();
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts') || process.env.RUN_SEED_DIRECT) {
  runSeed();
  closeDb();
}
