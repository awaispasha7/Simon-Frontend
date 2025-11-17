'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
// import { useTheme } from '@/lib/theme-context' // Unused for now

interface ResizableSidebarProps {
  children: React.ReactNode
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  className?: string
  isCollapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
  showNotification?: boolean
}

export function ResizableSidebar({ 
  children, 
  minWidth = 250, 
  maxWidth = 500, 
  defaultWidth = 300,
  className = '',
  isCollapsed: externalCollapsed,
  onCollapseChange,
  showNotification = false
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  const [isMobile, setIsMobile] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  // const { resolvedTheme } = useTheme() // Unused for now
  const touchStartXRef = useRef<number | null>(null)
  const touchCurrentXRef = useRef<number | null>(null)
  const hasSwipedRef = useRef<boolean>(false)

  // Check if screen is mobile (only collapse on very small screens)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // Only mobile phones, not tablets
      if (window.innerWidth < 640) {
        if (onCollapseChange) {
          onCollapseChange(true)
        } else {
          setInternalCollapsed(true)
        }
      } else {
        if (onCollapseChange) {
          onCollapseChange(false)
        } else {
          setInternalCollapsed(false) // Show sidebar on tablets and larger
        }
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [onCollapseChange])

  // Mobile swipe gestures: open on right-swipe from left edge; close on left-swipe
  useEffect(() => {
    if (!isMobile) return

    const EDGE_ACTIVATION_WIDTH = 24 // px from left edge to allow opening
    const SWIPE_THRESHOLD = 50 // px required to trigger action

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const x = e.touches[0].clientX
      // Allow opening only when collapsed and user starts near left edge
      if (isCollapsed) {
        if (x <= EDGE_ACTIVATION_WIDTH) {
          touchStartXRef.current = x
          touchCurrentXRef.current = x
          hasSwipedRef.current = false
        }
      } else {
        // When open, allow closing from anywhere in the sidebar overlay area
        touchStartXRef.current = x
        touchCurrentXRef.current = x
        hasSwipedRef.current = false
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartXRef.current === null) return
      const x = e.touches[0].clientX
      touchCurrentXRef.current = x
      const deltaX = x - touchStartXRef.current

      // Prevent vertical scroll jitter when horizontal gesture is dominant
      if (Math.abs(deltaX) > 10) {
        e.preventDefault()
      }

      if (!hasSwipedRef.current) {
        if (isCollapsed && deltaX > SWIPE_THRESHOLD) {
          // Open sidebar
          if (onCollapseChange) {
            onCollapseChange(false)
          } else {
            setInternalCollapsed(false)
          }
          hasSwipedRef.current = true
        } else if (!isCollapsed && deltaX < -SWIPE_THRESHOLD) {
          // Close sidebar
          if (onCollapseChange) {
            onCollapseChange(true)
          } else {
            setInternalCollapsed(true)
          }
          hasSwipedRef.current = true
        }
      }
    }

    const endGesture = () => {
      touchStartXRef.current = null
      touchCurrentXRef.current = null
      hasSwipedRef.current = false
    }

    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', endGesture)
    window.addEventListener('touchcancel', endGesture)

    return () => {
      window.removeEventListener('touchstart', onTouchStart as EventListener)
      window.removeEventListener('touchmove', onTouchMove as EventListener)
      window.removeEventListener('touchend', endGesture)
      window.removeEventListener('touchcancel', endGesture)
    }
  }, [isMobile, isCollapsed, onCollapseChange])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !sidebarRef.current) return

    const newWidth = e.clientX
    const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth)
    setWidth(clampedWidth)
  }, [isResizing, minWidth, maxWidth])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const toggleCollapse = () => {
    if (onCollapseChange) {
      onCollapseChange(!isCollapsed)
    } else {
      setInternalCollapsed(!isCollapsed)
    }
  }

  return (
    <>
      {/* Mobile Toggle Button - Only on very small screens */}
      {isMobile && (
        <button
          onClick={toggleCollapse}
          className={`fixed top-1/2 z-50 p-8 bg-linear-to-r from-red-500 to-orange-600 dark:from-red-600 dark:to-orange-700 rounded-full shadow-2xl border-2 border-white dark:border-gray-800 hover:from-red-600 hover:to-orange-700 dark:hover:from-red-700 dark:hover:to-orange-800 transition-all duration-300 hover:scale-110 active:scale-95 sm:hidden animate-pulse transform -translate-y-1/2 ${
            isCollapsed ? 'left-0' : 'right-0'
          }`} style={{ padding: '1.5rem 0.5rem', borderRadius: '0 30% 30% 0' }}
          title={isCollapsed ? "Open sidebar - View dossier & previous chats" : "Close sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-6 w-6 text-white drop-shadow-lg" />
          ) : (
            <ChevronLeft className="h-6 w-6 text-white drop-shadow-lg" />
          )}
          
          {/* Notification badge */}
          {showNotification && isCollapsed && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-ping">
              <div className="w-full h-full bg-red-500 rounded-full"></div>
            </div>
          )}
        </button>
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`${className} shrink-0 relative transition-all duration-300 h-full ${
          isMobile && isCollapsed ? 'w-0 overflow-hidden' : ''
        } ${isMobile && !isCollapsed ? 'fixed inset-0 z-50 w-full' : ''}`}
        style={{ 
          width: isMobile && isCollapsed ? '0px' : isMobile && !isCollapsed ? '100vw' : `${width}px`,
          minWidth: isMobile && isCollapsed ? '0px' : isMobile && !isCollapsed ? '100vw' : `${minWidth}px`,
          height: isMobile && !isCollapsed ? 'calc(var(--vh, 1vh) * 100)' : '100%'
        }}
      >
        {children}
        
        {/* Resize Handle - Hidden on mobile */}
        {!isMobile && (
          <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:w-2 transition-all duration-200 ${
              isResizing ? 'w-2 bg-blue-500' : 'bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>

    </>
  )
}
