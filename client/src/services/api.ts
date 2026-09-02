const BASE_URL = '/api'

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { name: string; email: string; phone: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: async () => {
    const res = await request<{ user: any }>('/auth/me')
    return res.user
  },

  updateProfile: async (data: any) => {
    const res = await request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.user
  },

  getVehicles: async () => {
    const res = await request<{ vehicles: any[] }>('/vehicles')
    return res.vehicles
  },

  addVehicle: async (data: any) => {
    const res = await request<{ vehicle: any }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.vehicle
  },

  updateVehicle: async (id: string, data: any) => {
    const res = await request<{ vehicle: any }>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.vehicle
  },

  deleteVehicle: (id: string) =>
    request<void>(`/vehicles/${id}`, { method: 'DELETE' }),

  getParkingSlots: async () => {
    const res = await request<{ slots: any[] }>('/parking/slots')
    return res.slots
  },

  getAvailableSlots: async (vehicleType?: string) => {
    const url = `/parking/available${vehicleType ? qs({ vehicleType }) : ''}`
    const res = await request<{ slots: any[] }>(url)
    return res.slots
  },

  getParkingZones: async () => {
    const res = await request<{ zones: any[] }>('/parking/zones')
    return res.zones
  },

  createReservation: async (data: any) => {
    const res = await request<{ reservation: any }>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.reservation
  },

  getReservations: async () => {
    const res = await request<{ reservations: any[] }>('/reservations')
    return res.reservations
  },

  getAdminReservations: async () => {
    const res = await request<{ reservations: any[] }>('/admin/reservations')
    return res.reservations
  },

  cancelReservation: (id: string) =>
    request<any>(`/reservations/${id}`, { method: 'DELETE' }),

  getActiveSessions: async () => {
    const res = await request<{ sessions: any[] }>('/parking/active')
    return res.sessions
  },

  getSessionHistory: async () => {
    const res = await request<{ sessions: any[] }>('/parking/sessions')
    return res.sessions
  },

  getSessionById: async (id: string) => {
    const res = await request<{ session: any }>(`/parking/sessions/${id}`)
    return res.session
  },

  exitParking: async (sessionId: string) => {
    const res = await request<{ session: any }>(`/parking/exit/${sessionId}`, {
      method: 'POST',
    })
    return res.session
  },

  simulateEntry: (vehicleType: string) =>
    request<any>('/simulation/entry', {
      method: 'POST',
      body: JSON.stringify({ vehicleType }),
    }),

  simulateExit: (vehicleId: string) =>
    request<any>(`/simulation/exit/${vehicleId}`, { method: 'POST' }),

  autoPark: () =>
    request<any>('/simulation/auto-park', { method: 'POST' }),

  simulateViolation: () =>
    request<any>('/simulation/violation', { method: 'POST' }),

  generateRandomTraffic: () =>
    request<any>('/simulation/random-traffic', { method: 'POST' }),

  getSimulationState: () => request<any>('/simulation/state'),

  pauseSimulation: () =>
    request<any>('/simulation/pause', { method: 'POST' }),

  resumeSimulation: () =>
    request<any>('/simulation/resume', { method: 'POST' }),

  resetSimulation: () =>
    request<any>('/simulation/reset', { method: 'POST' }),

  getDashboardStats: async () => {
    const res = await request<{ stats: any }>('/admin/dashboard')
    return res.stats
  },

  getOccupancyAnalytics: async (days?: number) => {
    const url = `/admin/analytics/occupancy${days ? qs({ days }) : ''}`
    const res = await request<{ data: any }>(url)
    return res.data
  },

  getRevenueAnalytics: async (days?: number) => {
    const url = `/admin/analytics/revenue${days ? qs({ days }) : ''}`
    const res = await request<{ data: any }>(url)
    return res.data
  },

  getVehicleTypeAnalytics: async () => {
    const res = await request<{ data: any }>('/admin/analytics/vehicle-types')
    return res.data
  },

  getZoneOccupancyAnalytics: async () => {
    const res = await request<{ data: any }>('/admin/analytics/zone-occupancy')
    return res.data
  },

  getPeakHoursAnalytics: async () => {
    const res = await request<{ data: any }>('/admin/analytics/peak-hours')
    return res.data
  },

  getPredictions: async (date?: string) => {
    const url = `/admin/analytics/predictions${date ? qs({ date }) : ''}`
    const res = await request<{ prediction: any }>(url)
    return res.prediction
  },

  getViolations: async () => {
    const res = await request<{ violations: any[]; stats: any }>('/admin/violations')
    return res.violations
  },

  getNotifications: async () => {
    const res = await request<{ notifications: any[] }>('/notifications')
    return res.notifications
  },

  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () =>
    request<any>('/notifications/read-all', { method: 'PUT' }),

  getUnreadCount: () => request<{ count: number }>('/notifications/unread-count'),

  getAdminUsers: async () => {
    const res = await request<{ users: any[] }>('/admin/users')
    return res.users
  },

  updateUser: async (id: string, data: any) => {
    const res = await request<{ user: any }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.user
  },

  getPricing: async () => {
    const res = await request<{ pricing: any[] }>('/admin/pricing')
    return res.pricing
  },

  updatePricing: async (id: string, data: any) => {
    const res = await request<{ pricing: any }>(`/admin/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return res.pricing
  },

  getAIPanel: async () => {
    const res = await request<{ recommendations: any[] }>('/simulation/ai-panel')
    const recs = res.recommendations || []
    const latest = recs[0]
    return {
      status: 'ONLINE',
      lastDecisionTime: latest?.createdAt || null,
      vehicleDetected: latest?.vehicleNumber || 'N/A',
      vehicleType: latest?.vehicleType || 'N/A',
      compatibleSlots: 0,
      recommendedSlot: latest?.slotNumber || latest?.recommendedSlot || 'N/A',
      confidence: latest?.recommendationScore || 0,
      routeDistance: 0,
      recentRecommendations: recs.slice(0, 10).map((r: any) => ({
        id: r.id,
        slot: r.slotNumber || r.recommendedSlot,
        score: r.recommendationScore,
        reason: r.reason,
        time: r.createdAt,
      })),
    }
  },

  getAILogs: async () => {
    const res = await request<{ logs: any[] }>('/admin/ai-logs')
    return res.logs
  },
}
