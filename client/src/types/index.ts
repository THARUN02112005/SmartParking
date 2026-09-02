export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface Vehicle {
  id: string
  userId: string
  vehicleNumber: string
  vehicleType: 'CAR' | 'BIKE' | 'EV_CAR' | 'EV_BIKE'
  model: string
  color: string
  isEV: boolean
}

export interface ParkingZone {
  id: string
  name: string
  description: string
  zoneType: string
  color: string
}

export interface ParkingSlot {
  id: string
  zoneId: string
  slotNumber: string
  slotType: string
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED' | 'MAINTENANCE'
  positionX: number
  positionY: number
  priority: number
  zoneName?: string
  zoneColor?: string
}

export interface Reservation {
  id: string
  userId: string
  vehicleId: string
  slotId: string
  startTime: string
  expiryTime: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED'
  slotNumber?: string
  vehicleNumber?: string
}

export interface ParkingSession {
  id: string
  vehicleId: string
  userId: string
  slotId: string
  entryTime: string
  exitTime: string | null
  duration: number | null
  fee: number | null
  paymentStatus: string
  status: 'ACTIVE' | 'COMPLETED'
  slotNumber?: string
  vehicleNumber?: string
  vehicleType?: string
}

export interface SimulationVehicle {
  id: string
  vehicleId: string
  vehicleType: string
  currentPositionX: number
  currentPositionY: number
  rotation: number
  targetSlot: string
  movementStatus: 'IDLE' | 'MOVING' | 'PARKING' | 'EXITING' | 'PARKED' | 'ENTERING'
  color: string
  vehicleNumber: string
  path?: { x: number; y: number }[]
}

export interface AIRecommendation {
  id: string
  vehicleId: string
  recommendedSlot: string
  recommendationScore: number
  reason: string
  createdAt: string
}

export interface Violation {
  id: string
  vehicleId: string
  violationType: string
  slotId: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  createdAt: string
  resolved: boolean
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  totalSlots: number
  availableSlots: number
  occupiedSlots: number
  reservedSlots: number
  blockedSlots: number
  activeVehicles: number
  todaySessions: number
  todayRevenue: number
  occupancyPercentage: number
}
