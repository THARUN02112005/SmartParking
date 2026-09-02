import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api'
import { useSocket } from '../context/SocketContext'
import type { SimulationVehicle, ParkingSlot, AIRecommendation } from '../types'

export function useSimulation() {
  const [vehicles, setVehicles] = useState<SimulationVehicle[]>([])
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const { socket } = useSocket()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchState = useCallback(async () => {
    try {
      const state = await api.getSimulationState()
      if (state) {
        if (state.vehicles) setVehicles(state.vehicles)
        if (state.slots) setSlots(state.slots)
        if (state.recommendations) setRecommendations(state.recommendations)
        if (state.isRunning !== undefined) setIsPaused(!state.isRunning)
      }
    } catch (err) {
      console.error('Failed to fetch simulation state:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(fetchState, 2000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused, fetchState])

  useEffect(() => {
    if (!socket) return

    const handleSimUpdate = (data: any) => {
      if (data.vehicles) setVehicles(data.vehicles)
      if (data.slots) setSlots(data.slots)
      if (data.recommendations) setRecommendations(data.recommendations)
      if (data.isRunning !== undefined) setIsPaused(!data.isRunning)
    }

    const handleSlotUpdate = (data: any) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === data.id ? { ...s, ...data } : s))
      )
    }

    socket.on('simulation:update', handleSimUpdate)
    socket.on('slot:updated', handleSlotUpdate)

    return () => {
      socket.off('simulation:update', handleSimUpdate)
      socket.off('slot:updated', handleSlotUpdate)
    }
  }, [socket])

  return { vehicles, slots, recommendations, isPaused, loading, refresh: fetchState }
}
