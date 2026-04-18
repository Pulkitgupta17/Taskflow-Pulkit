import {
  type ReactNode,
  type MouseEvent,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  children: ReactNode
}

interface DropdownMenuTriggerProps {
  children: ReactNode
  asChild?: boolean
}

interface DropdownMenuContentProps {
  children: ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
}

interface DropdownMenuItemProps {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent) => void
  destructive?: boolean
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose()
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, handleClose])

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>
        {Array.isArray(children)
          ? children.map((child, i) => {
              if (i === 0) return <div key="trigger">{child}</div>
              if (i === 1 && open)
                return (
                  <div key="content" onClick={() => setOpen(false)}>
                    {child}
                  </div>
                )
              return null
            })
          : children}
      </div>
    </div>
  )
}

function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  return <>{children}</>
}

function DropdownMenuContent({
  children,
  className,
  align = 'end',
}: DropdownMenuContentProps) {
  const alignClass =
    align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2'

  return (
    <div
      className={cn(
        'absolute top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        alignClass,
        className
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuItem({
  children,
  className,
  onClick,
  destructive,
}: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        destructive && 'text-destructive hover:text-destructive',
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function DropdownMenuSeparator() {
  return <div className="-mx-1 my-1 h-px bg-border" />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
