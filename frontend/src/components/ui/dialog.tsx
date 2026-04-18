import {
  type ReactNode,
  type MouseEvent,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    },
    [onOpenChange]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === overlayRef.current) onOpenChange(false)
  }

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* Dark backdrop — no blur to avoid affecting navbar */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden="true"
          />

          {/* Centering container */}
          <div
            ref={overlayRef}
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-6"
            onClick={handleOverlayClick}
          >
            {/* Animated dialog panel — slides in from right */}
            <motion.div
              className="relative z-10 w-full"
              initial={{ opacity: 0, x: 80, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 32,
                mass: 0.8,
              }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string
  children: ReactNode
  onClose?: () => void
}) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-2xl rounded-2xl bg-background p-8 sm:p-10 shadow-2xl ring-1 ring-black/5',
        'dark:bg-gray-900 dark:ring-white/10',
        className
      )}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 sm:right-5 sm:top-5 rounded-full p-1.5 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  )
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-2 text-center sm:text-left',
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground mt-2', className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-4',
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
