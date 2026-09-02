import { getDb } from '../database.js';
import { SimulationVehicle, Waypoint } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';
import { pathfindingService } from './pathfindingService.js';
import { aiRecommendationService } from './aiRecommendationService.js';
import { parkingService } from './parkingService.js';
import { notificationService } from './notificationService.js';

const VEHICLE_COLORS: Record<string, string[]> = {
  CAR: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
  BIKE: ['#FF6B35', '#004E89', '#1A936F', '#C5A880', '#5C4033', '#2E4057'],
  EV_CAR: ['#00D2FF', '#00F5A0', '#7B68EE', '#FF4500', '#00CED1', '#32CD32'],
  EV_BIKE: ['#FFD700', '#00FF7F', '#FF1493', '#00BFFF'],
};

const VEHICLE_NUMBERS = [
  'MH-12-AB-1234', 'KA-01-CD-5678', 'TN-09-EF-9012', 'DL-03-GH-3456',
  'MH-14-IJ-7890', 'KA-05-KL-2345', 'TN-07-MN-6789', 'DL-11-OP-0123',
  'MH-02-QR-4567', 'KA-09-ST-8901', 'TN-03-UV-2345', 'DL-06-WX-6789',
  'MH-06-YZ-0123', 'KA-02-AB-4567', 'TN-11-CD-8901', 'DL-08-EF-2345',
];

export class SimulationService {
  private animationQueue: Array<{ vehicleId: string; waypoints: Waypoint[]; currentStep: number }> = [];
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private vehicleCounter = 0;

  constructor() {
    this.isRunning = true;
    this.startSimulationLoop();
    this.seedInitialVehicles();
  }

  private seedInitialVehicles(): void {
    const db = getDb();
    const existing = db.prepare(`SELECT COUNT(*) as count FROM simulation_vehicles`).get() as { count: number };
    if (existing.count > 0) return;

    const types = ['CAR', 'BIKE', 'CAR', 'EV_CAR'];
    for (const type of types) {
      try {
        this.simulateVehicleEntry(type);
      } catch {}
    }
  }

  private startSimulationLoop(): void {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => {
      if (this.isRunning) {
        this.processAnimationQueue();
      }
    }, 500);
  }

  private processAnimationQueue(): void {
    const db = getDb();
    const completedSteps: number[] = [];

    for (let i = 0; i < this.animationQueue.length; i++) {
      const anim = this.animationQueue[i];
      if (anim.currentStep >= anim.waypoints.length - 1) {
        completedSteps.push(i);
        continue;
      }

      anim.currentStep++;
      const wp = anim.waypoints[anim.currentStep];
      const prevWp = anim.waypoints[anim.currentStep - 1];
      const rotation = Math.atan2(wp.y - prevWp.y, wp.x - prevWp.x) * (180 / Math.PI);

      db.prepare(`
        UPDATE simulation_vehicles
        SET currentPositionX = ?, currentPositionY = ?, rotation = ?
        WHERE vehicleId = ?
      `).run(wp.x, wp.y, rotation, anim.vehicleId);
    }

    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const completed = this.animationQueue[completedSteps[i]];
      const vehicle = db.prepare(`SELECT * FROM simulation_vehicles WHERE vehicleId = ?`).get(completed.vehicleId) as SimulationVehicle | undefined;

      if (vehicle && (vehicle.movementStatus === 'MOVING' || vehicle.movementStatus === 'PARKING') && vehicle.targetSlot) {
        db.prepare(`UPDATE simulation_vehicles SET movementStatus = 'PARKED' WHERE vehicleId = ?`).run(completed.vehicleId);
        parkingService.createParkingSession({
          vehicleId: completed.vehicleId,
          slotId: vehicle.targetSlot,
        });
      } else if (vehicle && vehicle.movementStatus === 'EXITING') {
        db.prepare(`DELETE FROM simulation_vehicles WHERE vehicleId = ?`).run(completed.vehicleId);
        const session = db.prepare(`SELECT * FROM parking_sessions WHERE vehicleId = ? AND status = 'ACTIVE' ORDER BY entryTime DESC LIMIT 1`).get(completed.vehicleId) as { id: string } | undefined;
        if (session) {
          parkingService.closeParkingSession(session.id);
        }
      }

      this.animationQueue.splice(completedSteps[i], 1);
    }
  }

  simulateVehicleEntry(vehicleType: string): { vehicle: SimulationVehicle; path: Waypoint[]; recommendation: any } {
    const db = getDb();
    this.vehicleCounter++;
    const colorIndex = this.vehicleCounter % (VEHICLE_COLORS[vehicleType] || VEHICLE_COLORS.CAR).length;
    const color = (VEHICLE_COLORS[vehicleType] || VEHICLE_COLORS.CAR)[colorIndex];
    const vehicleNumber = VEHICLE_NUMBERS[this.vehicleCounter % VEHICLE_NUMBERS.length];

    const entrance = pathfindingService.getEntrance();

    const recommendation = aiRecommendationService.getRecommendation(`sim-${this.vehicleCounter}`, vehicleType);

    let targetSlot: string | null = null;
    let path: Waypoint[] = [];

    if (recommendation) {
      targetSlot = recommendation.slot.id;
      path = pathfindingService.findPathToSlot(entrance, targetSlot);
      parkingService.updateSlotStatus(targetSlot, 'OCCUPIED');
    } else {
      path = [entrance];
    }

    const simVehicleId = uuidv4();
    const simVehicle: SimulationVehicle = {
      id: simVehicleId,
      vehicleId: `sim-${this.vehicleCounter}`,
      vehicleType,
      currentPositionX: entrance.x,
      currentPositionY: entrance.y,
      rotation: 0,
      targetSlot,
      movementStatus: recommendation ? 'MOVING' : 'ENTERING',
      color,
      vehicleNumber,
    };

    db.prepare(`
      INSERT INTO simulation_vehicles (id, vehicleId, vehicleType, currentPositionX, currentPositionY, rotation, targetSlot, movementStatus, color, vehicleNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(simVehicle.id, simVehicle.vehicleId, simVehicle.vehicleType, simVehicle.currentPositionX, simVehicle.currentPositionY, simVehicle.rotation, simVehicle.targetSlot, simVehicle.movementStatus, simVehicle.color, simVehicle.vehicleNumber);

    if (path.length > 1) {
      this.animationQueue.push({
        vehicleId: simVehicle.vehicleId,
        waypoints: path,
        currentStep: 0,
      });
    }

    return { vehicle: simVehicle, path, recommendation };
  }

  simulateVehicleExit(vehicleId: string): { vehicle: SimulationVehicle | null; path: Waypoint[] } {
    const db = getDb();
    const vehicle = db.prepare(`SELECT * FROM simulation_vehicles WHERE vehicleId = ?`).get(vehicleId) as SimulationVehicle | undefined;
    if (!vehicle) return { vehicle: null, path: [] };

    const exit = pathfindingService.getExit();
    const currentPos = { x: vehicle.currentPositionX, y: vehicle.currentPositionY };
    const path = pathfindingService.findPathToExit(currentPos);

    db.prepare(`UPDATE simulation_vehicles SET movementStatus = 'EXITING' WHERE vehicleId = ?`).run(vehicleId);

    if (vehicle.targetSlot) {
      parkingService.updateSlotStatus(vehicle.targetSlot, 'AVAILABLE');
    }

    this.animationQueue.push({
      vehicleId,
      waypoints: path,
      currentStep: 0,
    });

    return { vehicle: { ...vehicle, movementStatus: 'EXITING' }, path };
  }

  autoPark(): { entry: any; exit: any } {
    const vehicleTypes = ['CAR', 'BIKE', 'EV_CAR', 'EV_BIKE'];
    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const entry = this.simulateVehicleEntry(vehicleType);

    const autoExitTime = 10000 + Math.random() * 20000;
    setTimeout(() => {
      this.simulateVehicleExit(entry.vehicle.vehicleId);
    }, autoExitTime);

    return { entry, exit: { scheduled: true, delay: autoExitTime } };
  }

  simulateViolation(): { vehicleType: string; violationType: string; severity: string } {
    const db = getDb();
    const violationTypes = ['UNAUTHORIZED_PARKING', 'OVERSTAY', 'WRONG_SLOT', 'BLOCKING', 'NO_PAYMENT'];
    const severities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const vehicleTypes = ['CAR', 'BIKE', 'EV_CAR', 'EV_BIKE'];

    const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    const id = uuidv4();
    const vehicleId = `violation-${uuidv4().slice(0, 8)}`;

    const descriptions: Record<string, string> = {
      UNAUTHORIZED_PARKING: 'Vehicle parked without authorization in restricted area',
      OVERSTAY: 'Vehicle exceeded maximum parking duration',
      WRONG_SLOT: 'Vehicle parked in slot designated for different vehicle type',
      BLOCKING: 'Vehicle blocking access to other parking slots',
      NO_PAYMENT: 'Vehicle attempted to exit without payment',
    };

    db.prepare(`
      INSERT INTO violations (id, vehicleId, violationType, severity, description, createdAt, resolved)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(id, vehicleId, violationType, severity, descriptions[violationType], new Date().toISOString());

    const slots = db.prepare(`SELECT id FROM parking_slots LIMIT 1`).get() as { id: string } | undefined;
    if (slots) {
      db.prepare(`UPDATE violations SET slotId = ? WHERE id = ?`).run(slots.id, id);
    }

    return { vehicleType, violationType, severity };
  }

  generateRandomTraffic(): SimulationVehicle[] {
    const count = 1 + Math.floor(Math.random() * 4);
    const results: SimulationVehicle[] = [];

    for (let i = 0; i < count; i++) {
      const vehicleTypes = ['CAR', 'BIKE', 'EV_CAR', 'EV_BIKE'];
      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const result = this.simulateVehicleEntry(vehicleType);
      results.push(result.vehicle);
    }

    return results;
  }

  getSimulationState(): { vehicles: SimulationVehicle[]; slots: any[]; recommendations: any[]; isRunning: boolean; animationQueueLength: number } {
    const db = getDb();
    const vehicles = db.prepare(`SELECT * FROM simulation_vehicles ORDER BY id`).all() as SimulationVehicle[];
    const slots = db.prepare(`
      SELECT s.*, z.name as zoneName, z.color as zoneColor
      FROM parking_slots s
      JOIN parking_zones z ON s.zoneId = z.id
      ORDER BY z.name, s.slotNumber
    `).all();
    const recommendations = db.prepare(`
      SELECT * FROM ai_recommendations ORDER BY createdAt DESC LIMIT 20
    `).all();
    return {
      vehicles,
      slots,
      recommendations,
      isRunning: this.isRunning,
      animationQueueLength: this.animationQueue.length,
    };
  }

  pause(): void {
    this.isRunning = false;
  }

  resume(): void {
    this.isRunning = true;
  }

  reset(): void {
    const db = getDb();
    db.prepare(`DELETE FROM simulation_vehicles`).run();
    db.prepare(`UPDATE parking_slots SET status = 'AVAILABLE' WHERE status = 'OCCUPIED'`).run();
    this.animationQueue = [];
    this.vehicleCounter = 0;
    this.isRunning = false;
  }
}

export const simulationService = new SimulationService();
