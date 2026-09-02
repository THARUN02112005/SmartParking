import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

interface CardActionsProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-dark-800/60 backdrop-blur-sm border border-dark-700/50 rounded-xl',
        hover && 'hover:border-dark-600 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-dark-900/50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('px-6 py-4 border-b border-dark-700/50', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  )
}

export function CardActions({ children, className }: CardActionsProps) {
  return (
    <div className={clsx('px-6 py-3 border-t border-dark-700/50 flex items-center gap-2', className)}>
      {children}
    </div>
  )
}
