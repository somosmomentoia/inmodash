import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui'

interface PermissionButtonProps {
  module: string
  action: string
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function PermissionButton({ 
  module, 
  action, 
  children, 
  onClick,
  variant,
  size,
  className,
  disabled,
  leftIcon,
  rightIcon
}: PermissionButtonProps) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(module, action)) {
    return null
  }

  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
    >
      {children}
    </Button>
  )
}
