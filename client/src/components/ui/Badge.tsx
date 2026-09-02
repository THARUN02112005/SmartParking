import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
}

const variantClasses = {
  default: 'bg-dark-600 text-dark-200',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export default function Badge({ children, variant = 'default', size = 'sm', dot }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size]
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', {
            'bg-green-400': variant === 'success',
            'bg-amber-400': variant === 'warning',
            'bg-red-400': variant === 'danger',
            'bg-blue-400': variant === 'info',
            'bg-purple-400': variant === 'purple',
            'bg-dark-400': variant === 'default',
          })}
        />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    AVAILABLE: { variant: 'success', label: 'Available' },
    OCCUPIED: { variant: 'danger', label: 'Occupied' },
    RESERVED: { variant: 'warning', label: 'Reserved' },
    BLOCKED: { variant: 'default', label: 'Blocked' },
    MAINTENANCE: { variant: 'warning', label: 'Maintenance' },
    ACTIVE: { variant: 'info', label: 'Active' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    EXPIRED: { variant: 'danger', label: 'Expired' },
    CANCELLED: { variant: 'default', label: 'Cancelled' },
    IDLE: { variant: 'default', label: 'Idle' },
    MOVING: { variant: 'info', label: 'Moving' },
    PARKING: { variant: 'purple', label: 'Parking' },
    EXITING: { variant: 'warning', label: 'Exiting' },
    PARKED: { variant: 'success', label: 'Parked' },
    LOW: { variant: 'info', label: 'Low' },
    MEDIUM: { variant: 'warning', label: 'Medium' },
    HIGH: { variant: 'danger', label: 'High' },
    CRITICAL: { variant: 'danger', label: 'Critical' },
  }
  const config = map[status] || { variant: 'default' as const, label: status }
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}
