'use client'

import { useState } from 'react'
import { UserPlus, LogIn, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InteractiveButtonProps {
  type: 'signup' | 'login' | 'new-story'
  onClick: () => void
  className?: string
}

export function InteractiveButton({ type, onClick, className }: InteractiveButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getButtonConfig = () => {
    switch (type) {
      case 'signup':
        return {
          icon: UserPlus,
          text: 'Sign Up',
          gradient: 'from-red-500 to-orange-500',
          hoverGradient: 'from-red-600 to-orange-600',
          description: 'Create unlimited stories'
        }
      case 'login':
        return {
          icon: LogIn,
          text: 'Sign In',
          gradient: 'from-red-500 to-orange-500',
          hoverGradient: 'from-red-600 to-orange-600',
          description: 'Access your stories'
        }
      case 'new-story':
        return {
          icon: Sparkles,
          text: 'New Story',
          gradient: 'from-emerald-500 to-teal-500',
          hoverGradient: 'from-emerald-600 to-teal-600',
          description: 'Start fresh story'
        }
    }
  }

  const config = getButtonConfig()
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-white",
        `bg-linear-to-r ${config.gradient} hover:bg-linear-to-r ${config.hoverGradient}`,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{config.text}</span>
      {isHovered && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {config.description}
        </div>
      )}
    </button>
  )
}

interface ChatActionButtonsProps {
  onSignup: () => void
  onLogin: () => void
  onNewStory?: () => void
  showNewStory?: boolean
  className?: string
}

export function ChatActionButtons({ 
  onSignup, 
  onLogin, 
  onNewStory, 
  showNewStory = false,
  className 
}: ChatActionButtonsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2 mt-3", className)}>
      <InteractiveButton type="signup" onClick={onSignup} />
      <InteractiveButton type="login" onClick={onLogin} />
      {showNewStory && onNewStory && (
        <InteractiveButton type="new-story" onClick={onNewStory} />
      )}
    </div>
  )
}
