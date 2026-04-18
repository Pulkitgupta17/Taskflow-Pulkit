import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FolderOpen, CalendarDays, ListTodo } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
}

export const projectCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    setRotateX((-mouseY / (rect.height / 2)) * 5)
    setRotateY((mouseX / (rect.width / 2)) * 5)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setRotateX(0)
    setRotateY(0)
    setIsHovered(false)
  }, [])

  return (
    <div style={{ perspective: '1000px' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
          scale: isHovered ? 1.02 : 1,
          translateZ: isHovered ? 10 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
            isHovered
              ? 'border-transparent ring-1 ring-gradient-to-r from-indigo-500/30 to-violet-500/30'
              : ''
          }`}
          style={
            isHovered
              ? {
                  borderImage: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3)) 1',
                  borderImageSlice: 1,
                }
              : undefined
          }
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{project.name}</CardTitle>
                {project.description && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ListTodo className="h-3.5 w-3.5" />
                <span>{project.task_count ?? 0} tasks</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{formatRelativeDate(project.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
