import clsx from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-dark-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-4">
      {icon && <div className="text-dark-500 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-dark-300">{title}</h3>
      {description && <p className="mt-1 text-dark-500 text-sm">{description}</p>}
    </div>
  )
}
