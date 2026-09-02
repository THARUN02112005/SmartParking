export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: 'CAR' | 'BIKE' | 'EV_CAR' | 'EV_BIKE';
  model: string | null;
  color: string | null;
  isEV: number;
  createdAt: string;
}

export interface ParkingZone {
  id: string;
  name: string;
  description: string | null;
  zoneType: string;
  color: string | null;
}

export interface ParkingSlot {
  id: string;
  zoneId: string;
  slotNumber: string;
  slotType: 'STANDARD' | 'COMPACT' | 'EV' | 'PREMIUM' | 'HANDICAP';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED' | 'MAINTENANCE';
  positionX: number;
  positionY: number;
  priority: number;
}

export interface Reservation {
  id: string;
  userId: string;
  vehicleId: string;
  slotId: string;
  startTime: string;
  expiryTime: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
}

export interface ParkingSession {
  id: string;
  vehicleId: string;
  userId: string | null;
  slotId: string | null;
  entryTime: string;
  exitTime: string | null;
  duration: number | null;
  fee: number | null;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'WAIVED';
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface SimulationVehicle {
  id: string;
  vehicleId: string;
  vehicleType: string;
  currentPositionX: number;
  currentPositionY: number;
  rotation: number;
  targetSlot: string | null;
  movementStatus: 'IDLE' | 'MOVING' | 'PARKING' | 'PARKED' | 'ENTERING' | 'EXITING';
  color: string | null;
  vehicleNumber: string | null;
}

export interface AIRecommendation {
  id: string;
  vehicleId: string;
  recommendedSlot: string;
  recommendationScore: number;
  reason: string;
  createdAt: string;
}

export interface Violation {
  id: string;
  vehicleId: string;
  violationType: string;
  slotId: string | null;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string | null;
  createdAt: string;
  resolved: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS' | 'PAYMENT';
  isRead: number;
  createdAt: string;
}

export interface Pricing {
  id: string;
  vehicleType: string;
  pricePerHour: number;
  minimumFee: number;
}

export interface SlotWithZone extends ParkingSlot {
  zoneName: string;
  zoneColor: string;
}

export interface DashboardStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  blockedSlots: number;
  activeVehicles: number;
  todaySessions: number;
  todayRevenue: number;
  occupancyPercentage: number;
}

export interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface SlotScore {
  slotId: string;
  slotNumber: string;
  score: number;
  reasons: string[];
}
