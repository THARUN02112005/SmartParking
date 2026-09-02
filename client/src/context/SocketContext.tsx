import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
}

const SocketContext = createContext<SocketContextType>({ socket: null })

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const backendUrl = import.meta.env.VITE_API_URL || window.location.origin
    const s = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    s.on('connect', () => console.log('Socket connected:', s.id))
    s.on('disconnect', () => console.log('Socket disconnected'))

    s.on('vehicle:moved', (data) => console.log('Vehicle moved:', data))
    s.on('vehicle:parked', (data) => console.log('Vehicle parked:', data))
    s.on('vehicle:exited', (data) => console.log('Vehicle exited:', data))
    s.on('slot:updated', (data) => console.log('Slot updated:', data))
    s.on('violation:detected', (data) => console.log('Violation detected:', data))
    s.on('simulation:update', (data) => console.log('Simulation update:', data))
    s.on('notification:new', (data) => console.log('New notification:', data))

    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
