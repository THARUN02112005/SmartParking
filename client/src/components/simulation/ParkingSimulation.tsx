import { useRef, useEffect, useState, useCallback } from 'react'
import type { SimulationVehicle, ParkingSlot } from '../../types'

interface Props {
  vehicles: SimulationVehicle[]
  slots: ParkingSlot[]
  width?: number
  height?: number
}

const CANVAS_W = 900
const CANVAS_H = 600

const SLOT_W = 50
const SLOT_H = 30
const ROAD_W = 40

const ENTRANCE = { x: 50, y: 300 }
const EXIT = { x: 850, y: 300 }

const ZONES: Record<string, { label: string; color: string; y: number; rows: number; cols: number; startX: number }> = {
  A: { label: 'Zone A - Cars', color: '#3b82f6', y: 80, rows: 2, cols: 6, startX: 150 },
  B: { label: 'Zone B - Bikes', color: '#22c55e', y: 390, rows: 2, cols: 6, startX: 150 },
  C: { label: 'Zone C - EV', color: '#a855f7', y: 80, rows: 2, cols: 4, startX: 550 },
  D: { label: 'Zone D - Premium', color: '#f59e0b', y: 420, rows: 2, cols: 4, startX: 550 },
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#22c55e',
  OCCUPIED: '#ef4444',
  RESERVED: '#eab308',
  BLOCKED: '#6b7280',
  MAINTENANCE: '#f97316',
}

const VEHICLE_COLORS: Record<string, string> = {
  CAR: '#60a5fa',
  BIKE: '#34d399',
  EV_CAR: '#a78bfa',
  EV_BIKE: '#fbbf24',
}

interface AnimatedVehicle {
  id: string
  x: number
  y: number
  targetX: number
  targetY: number
  rotation: number
  targetRotation: number
  color: string
  type: string
  number: string
  status: string
  pathIndex: number
  path: { x: number; y: number }[]
  opacity: number
  scale: number
}

function buildSlotLayout(slots: ParkingSlot[]) {
  const layout: { slot: ParkingSlot; x: number; y: number }[] = []
  for (const zoneKey of Object.keys(ZONES)) {
    const zone = ZONES[zoneKey]
    const zoneSlots = slots.filter((s) => s.slotNumber.toUpperCase().startsWith(zoneKey))
      .sort((a, b) => {
        const numA = parseInt(a.slotNumber.replace(/^[A-Z]-?/, '')) || 0
        const numB = parseInt(b.slotNumber.replace(/^[A-Z]-?/, '')) || 0
        return numA - numB
      })
    let idx = 0
    for (let row = 0; row < zone.rows; row++) {
      for (let col = 0; col < zone.cols; col++) {
        if (idx < zoneSlots.length) {
          layout.push({
            slot: zoneSlots[idx],
            x: zone.startX + col * (SLOT_W + 12),
            y: zone.y + row * (SLOT_H + 20),
          })
          idx++
        }
      }
    }
  }
  return layout
}

function findSlotCenter(slotNum: string): { x: number; y: number } {
  const zoneKey = slotNum.charAt(0)
  const zone = ZONES[zoneKey]
  if (!zone) return { x: 450, y: 300 }
  const numStr = slotNum.replace(/^[A-Z]-?/, '')
  const idx = parseInt(numStr) - 1
  if (isNaN(idx)) return { x: 450, y: 300 }
  const row = Math.floor(idx / zone.cols)
  const col = idx % zone.cols
  return {
    x: zone.startX + col * (SLOT_W + 12) + SLOT_W / 2,
    y: zone.y + row * (SLOT_H + 20) + SLOT_H / 2,
  }
}

function buildPath(targetSlot: string): { x: number; y: number }[] {
  const target = findSlotCenter(targetSlot)
  const zoneKey = targetSlot.charAt(0)
  const zone = ZONES[zoneKey]
  const roadY = ENTRANCE.y

  const waypoints: { x: number; y: number }[] = [
    { x: ENTRANCE.x, y: roadY },
  ]

  const col = Math.floor((target.x - (zone?.startX || 150)) / (SLOT_W + 12))
  const roadX = (zone?.startX || 150) + col * (SLOT_W + 12) + SLOT_W / 2

  waypoints.push({ x: roadX, y: roadY })

  const branchStartY = zone && zone.y < roadY ? zone.y + zone.rows * (SLOT_H + 20) + 5 : zone ? zone.y - 5 : roadY
  if (Math.abs(branchStartY - roadY) > 5) {
    waypoints.push({ x: roadX, y: branchStartY })
  }

  waypoints.push({ x: roadX, y: target.y })
  waypoints.push({ x: target.x, y: target.y })

  return waypoints
}

function buildExitPath(currentX: number, currentY: number): { x: number; y: number }[] {
  return [
    { x: currentX, y: currentY },
    { x: currentX, y: ENTRANCE.y },
    { x: 600, y: ENTRANCE.y },
    { x: EXIT.x - 20, y: EXIT.y },
    { x: EXIT.x, y: EXIT.y },
  ]
}

export default function ParkingSimulation({ vehicles, slots, width = CANVAS_W, height = CANVAS_H }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const animatedVehicles = useRef<Map<string, AnimatedVehicle>>(new Map())
  const [hoveredSlot, setHoveredSlot] = useState<{ x: number; y: number; slot: ParkingSlot } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const slotLayout = useRef(buildSlotLayout(slots))

  useEffect(() => {
    slotLayout.current = buildSlotLayout(slots)
  }, [slots])

  const drawParkingLot = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = CANVAS_W
    const h = CANVAS_H

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, ENTRANCE.y - ROAD_W / 2, w, ROAD_W)

    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(0, ENTRANCE.y)
    ctx.lineTo(w, ENTRANCE.y)
    ctx.stroke()
    ctx.setLineDash([])

    for (const zoneKey of Object.keys(ZONES)) {
      const zone = ZONES[zoneKey]
      const firstSlot = slotLayout.current.find((s) => s.slot.slotNumber.startsWith(zoneKey))
      if (!firstSlot) continue

      const zoneStartX = zone.startX - 20
      const zoneEndX = zone.startX + zone.cols * (SLOT_W + 12) + 10
      const zoneStartY = zone.y - 25
      const zoneEndY = zone.y + zone.rows * (SLOT_H + 20) + 10

      ctx.fillStyle = zone.color + '10'
      ctx.strokeStyle = zone.color + '40'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(zoneStartX, zoneStartY, zoneEndX - zoneStartX, zoneEndY - zoneStartY, 8)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = zone.color
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.fillText(zone.label, zoneStartX + 5, zoneStartY - 5)

      ctx.fillStyle = '#1e293b'
      const branchY = zone.y < 300 ? zone.y + zone.rows * (SLOT_H + 20) : zone.y
      ctx.fillRect(300, ENTRANCE.y - ROAD_W / 2, ROAD_W, branchY - ENTRANCE.y + (zone.y < 300 ? 30 : -30))
    }

    for (const { slot, x, y } of slotLayout.current) {
      const color = STATUS_COLORS[slot.status] || '#6b7280'
      ctx.fillStyle = color + '30'
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(x, y, SLOT_W, SLOT_H, 4)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = color
      ctx.font = 'bold 9px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(slot.slotNumber, x + SLOT_W / 2, y + SLOT_H / 2 + 3)
      ctx.textAlign = 'left'
    }

    const time = Date.now() / 1000
    const entranceGlow = 0.3 + Math.sin(time * 2) * 0.2

    ctx.beginPath()
    const eGrad = ctx.createRadialGradient(ENTRANCE.x, ENTRANCE.y, 5, ENTRANCE.x, ENTRANCE.y, 40)
    eGrad.addColorStop(0, `rgba(34, 197, 94, ${entranceGlow})`)
    eGrad.addColorStop(1, 'rgba(34, 197, 94, 0)')
    ctx.fillStyle = eGrad
    ctx.arc(ENTRANCE.x, ENTRANCE.y, 40, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#22c55e'
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ENTRANCE', ENTRANCE.x, ENTRANCE.y - 30)

    const exitGlow = 0.3 + Math.sin(time * 2 + 1) * 0.2
    ctx.beginPath()
    const exGrad = ctx.createRadialGradient(EXIT.x, EXIT.y, 5, EXIT.x, EXIT.y, 40)
    exGrad.addColorStop(0, `rgba(239, 68, 68, ${exitGlow})`)
    exGrad.addColorStop(1, 'rgba(239, 68, 68, 0)')
    ctx.fillStyle = exGrad
    ctx.arc(EXIT.x, EXIT.y, 40, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.fillText('EXIT', EXIT.x, EXIT.y - 30)
    ctx.textAlign = 'left'
  }, [])

  const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: { x: number; y: number }[], color: string) => {
    if (path.length < 2) return
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y)
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }, [])

  const drawVehicle = useCallback((ctx: CanvasRenderingContext2D, v: AnimatedVehicle) => {
    ctx.save()
    ctx.translate(v.x, v.y)
    ctx.rotate((v.rotation * Math.PI) / 180)
    ctx.globalAlpha = v.opacity

    const isBike = v.type.includes('BIKE')
    const w = isBike ? 20 : 30
    const h = isBike ? 12 : 18

    ctx.fillStyle = v.color
    ctx.shadowColor = v.color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.roundRect(-w / 2, -h / 2, w, h, 3)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(w / 2 - 3, 0, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffffcc'
    ctx.font = 'bold 7px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(v.number.slice(-4), 0, 3)
    ctx.textAlign = 'left'

    ctx.globalAlpha = 1
    ctx.restore()
  }, [])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(pan.x, pan.y)

    drawParkingLot(ctx)

    const existingIds = new Set(vehicles.map((v) => v.id))

    for (const v of vehicles) {
      let anim = animatedVehicles.current.get(v.id)

      if (!anim) {
        const isEntry = v.movementStatus === 'MOVING' || v.movementStatus === 'PARKING'
        const isParked = v.movementStatus === 'PARKED'
        const isExiting = v.movementStatus === 'EXITING'

        let startX: number, startY: number
        let path: { x: number; y: number }[]

        if (isParked && v.targetSlot) {
          const slotCenter = findSlotCenter(v.targetSlot)
          startX = slotCenter.x
          startY = slotCenter.y
          path = [{ x: slotCenter.x, y: slotCenter.y }]
        } else if (isEntry) {
          startX = ENTRANCE.x
          startY = ENTRANCE.y
          path = v.targetSlot ? buildPath(v.targetSlot) : [{ x: ENTRANCE.x, y: ENTRANCE.y }]
        } else if (isExiting) {
          startX = v.currentPositionX
          startY = v.currentPositionY
          path = buildExitPath(v.currentPositionX, v.currentPositionY)
        } else {
          startX = ENTRANCE.x
          startY = ENTRANCE.y
          path = [{ x: ENTRANCE.x, y: ENTRANCE.y }]
        }

        anim = {
          id: v.id,
          x: startX,
          y: startY,
          targetX: v.currentPositionX,
          targetY: v.currentPositionY,
          rotation: 0,
          targetRotation: 0,
          color: VEHICLE_COLORS[v.vehicleType] || '#60a5fa',
          type: v.vehicleType,
          number: v.vehicleNumber,
          status: v.movementStatus,
          pathIndex: 0,
          path,
          opacity: 1,
          scale: 1,
        }
        animatedVehicles.current.set(v.id, anim)
      }

      anim.status = v.movementStatus
      anim.color = VEHICLE_COLORS[v.vehicleType] || '#60a5fa'
      anim.number = v.vehicleNumber

      if (v.movementStatus === 'MOVING' || v.movementStatus === 'PARKING') {
        if (anim.path.length > 0) {
          const target = anim.path[anim.pathIndex]
          if (target) {
            const dx = target.x - anim.x
            const dy = target.y - anim.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 3) {
              anim.pathIndex++
              if (anim.pathIndex >= anim.path.length) {
                anim.pathIndex = anim.path.length - 1
              }
            } else {
              const speed = 2.5
              anim.x += (dx / dist) * speed
              anim.y += (dy / dist) * speed
              anim.targetRotation = (Math.atan2(dy, dx) * 180) / Math.PI
            }
          }
        }
      } else if (v.movementStatus === 'PARKED' && v.targetSlot) {
        const slotCenter = findSlotCenter(v.targetSlot)
        anim.x += (slotCenter.x - anim.x) * 0.15
        anim.y += (slotCenter.y - anim.y) * 0.15
        anim.rotation = 0
        anim.targetRotation = 0
      } else if (v.movementStatus === 'EXITING') {
        if (anim.path.length > 0) {
          const target = anim.path[anim.pathIndex]
          if (target) {
            const dx = target.x - anim.x
            const dy = target.y - anim.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 3) {
              anim.pathIndex++
              if (anim.pathIndex >= anim.path.length) {
                anim.opacity = Math.max(0, anim.opacity - 0.02)
              }
            } else {
              const speed = 2.5
              anim.x += (dx / dist) * speed
              anim.y += (dy / dist) * speed
              anim.targetRotation = (Math.atan2(dy, dx) * 180) / Math.PI
            }
          }
        }
      } else {
        const targetX = v.movementStatus === 'ENTERING' ? ENTRANCE.x : v.currentPositionX
        const targetY = v.movementStatus === 'ENTERING' ? ENTRANCE.y : v.currentPositionY
        const dx = targetX - anim.x
        const dy = targetY - anim.y
        anim.x += dx * 0.1
        anim.y += dy * 0.1
      }

      const rotDiff = anim.targetRotation - anim.rotation
      anim.rotation += rotDiff * 0.1

      if (anim.opacity > 0) {
        if (anim.status === 'MOVING' || anim.status === 'EXITING') {
          drawPath(ctx, anim.path, anim.color + '80')
        }
        drawVehicle(ctx, anim)
      }
    }

    for (const [id, anim] of animatedVehicles.current) {
      if (!existingIds.has(id)) {
        anim.opacity -= 0.02
        if (anim.opacity <= 0) {
          animatedVehicles.current.delete(id)
        } else {
          drawVehicle(ctx, anim)
        }
      }
    }

    ctx.restore()

    animRef.current = requestAnimationFrame(animate)
  }, [vehicles, slots, zoom, pan, drawParkingLot, drawVehicle, drawPath])

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [animate])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.max(0.5, Math.min(3, z + delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - lastMouse.current.x
        const dy = e.clientY - lastMouse.current.y
        setPan((p) => ({ x: p.x + dx / zoom, y: p.y + dy / zoom }))
        lastMouse.current = { x: e.clientX, y: e.clientY }
      }

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / zoom - pan.x
      const my = (e.clientY - rect.top) / zoom - pan.y

      for (const { slot, x, y } of slotLayout.current) {
        if (mx >= x && mx <= x + SLOT_W && my >= y && my <= y + SLOT_H) {
          setHoveredSlot({ x: e.clientX, y: e.clientY, slot })
          return
        }
      }
      setHoveredSlot(null)
    },
    [zoom, pan]
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-xl border border-dark-700/50 bg-dark-950"
        style={{ width: '100%', height: 'auto', maxWidth: CANVAS_W }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {hoveredSlot && (
        <div
          className="fixed z-50 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 shadow-xl pointer-events-none text-sm"
          style={{ left: hoveredSlot.x + 12, top: hoveredSlot.y - 10 }}
        >
          <p className="font-semibold text-dark-100">{hoveredSlot.slot.slotNumber}</p>
          <p className="text-dark-400 text-xs">Status: {hoveredSlot.slot.status}</p>
          <p className="text-dark-400 text-xs">Type: {hoveredSlot.slot.slotType}</p>
          {hoveredSlot.slot.zoneName && (
            <p className="text-dark-400 text-xs">Zone: {hoveredSlot.slot.zoneName}</p>
          )}
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
          className="w-8 h-8 bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-lg text-dark-300 hover:bg-dark-700 flex items-center justify-center text-sm font-bold"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
          className="w-8 h-8 bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-lg text-dark-300 hover:bg-dark-700 flex items-center justify-center text-sm font-bold"
        >
          -
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          className="px-2 h-8 bg-dark-800/80 backdrop-blur-sm border border-dark-600 rounded-lg text-dark-300 hover:bg-dark-700 flex items-center justify-center text-xs"
        >
          Reset
        </button>
      </div>

      <div className="absolute top-3 right-3 flex gap-3 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-dark-400">{status.toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
