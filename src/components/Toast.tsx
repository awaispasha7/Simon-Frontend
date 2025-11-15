'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, HelpCircle } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'new-chat-warning' | 'input'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  onLogin?: () => void
  onSignup?: () => void
  // For input toasts
  inputDefault?: string
  inputPlaceholder?: string
  inputOnConfirm?: (value: string) => void
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastComponent({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const { resolvedTheme } = useTheme()
  const [inputValue, setInputValue] = useState<string>(toast.inputDefault || '')

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }, [onRemove, toast.id])

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove()
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, handleRemove])


  const getToastStyles = () => {
    const baseStyles = "relative flex items-start gap-3 p-4 rounded-xl shadow-xl transition-all duration-300 ease-in-out"
    
    // Add border and backdrop blur only for confirm toasts
    const confirmStyles = toast.type === 'confirm' 
      ? "border border-orange-200/50 dark:border-orange-800/50 backdrop-blur-md shadow-2xl shadow-orange-500/10"
      : "border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm"
    
    // Add stacked border effect for confirm toasts
    const stackedEffect = toast.type === 'confirm' 
      ? "before:absolute before:inset-0 before:rounded-xl before:border before:border-orange-300/30 dark:before:border-orange-700/30 before:shadow-lg before:-z-10 after:absolute after:inset-0 after:rounded-xl after:border after:border-orange-400/20 dark:after:border-orange-600/20 after:shadow-md after:-z-20"
      : ""
    
    if (isLeaving) {
      return `${baseStyles} ${confirmStyles} ${stackedEffect} transform translate-x-full opacity-0`
    }
    
    if (isVisible) {
      return `${baseStyles} ${confirmStyles} ${stackedEffect} transform translate-x-0 opacity-100`
    }
    
    return `${baseStyles} ${confirmStyles} ${stackedEffect} transform translate-x-full opacity-0`
  }

  const getTypeStyles = () => {
    // Base styles - we'll override with inline styles for dark mode
    switch (toast.type) {
      case 'success':
        return resolvedTheme === 'light'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-green-900/20 border-green-800 text-green-300'
      case 'error':
        return resolvedTheme === 'light'
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-red-900/20 border-red-800 text-red-300'
      case 'warning':
        return resolvedTheme === 'light'
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-yellow-900/20 border-yellow-800 text-yellow-300'
      case 'info':
        return resolvedTheme === 'light'
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : 'bg-blue-900/20 border-blue-800 text-blue-300'
      case 'confirm':
        return resolvedTheme === 'light'
          ? 'bg-orange-50/80 text-orange-800'
          : 'bg-orange-900/30 text-orange-300'
      case 'new-chat-warning':
        return resolvedTheme === 'light'
          ? 'bg-orange-50/90 text-orange-900'
          : 'bg-gray-800/95 text-gray-100'
      case 'input':
        return resolvedTheme === 'light'
          ? 'bg-gray-50 border-gray-200 text-gray-800'
          : 'bg-gray-900/30 border-gray-800 text-gray-200'
      default:
        return resolvedTheme === 'light'
          ? 'bg-gray-50 border-gray-200 text-gray-800'
          : 'bg-gray-900/20 border-gray-800 text-gray-300'
    }
  }

  const getDarkModeStyles = () => {
    if (resolvedTheme !== 'dark') return {}
    
    switch (toast.type) {
      case 'success':
        return {
          backgroundColor: 'rgba(20, 83, 45, 0.95)', // dark green with high opacity
          color: '#86efac', // bright green-300
          borderColor: '#16a34a', // green-600
        }
      case 'error':
        return {
          backgroundColor: 'rgba(127, 29, 29, 0.95)', // dark red with high opacity
          color: '#fca5a5', // bright red-300
          borderColor: '#dc2626', // red-600
        }
      case 'warning':
        return {
          backgroundColor: 'rgba(113, 63, 18, 0.95)', // dark yellow/amber with high opacity
          color: '#fde047', // bright yellow-300
          borderColor: '#d97706', // amber-600
        }
      case 'info':
        return {
          backgroundColor: 'rgba(30, 58, 138, 0.95)', // dark blue with high opacity
          color: '#93c5fd', // bright blue-300
          borderColor: '#2563eb', // blue-600
        }
      case 'confirm':
        return {
          backgroundColor: 'rgba(124, 45, 18, 0.95)', // dark orange with high opacity
          color: '#fdba74', // bright orange-300
          borderColor: '#ea580c', // orange-600
        }
      case 'new-chat-warning':
        return {
          backgroundColor: 'rgba(31, 41, 55, 0.98)', // dark gray-800 with very high opacity
          color: '#f3f4f6', // gray-100 - very bright text
          borderColor: '#f97316', // orange-500 - prominent border
        }
      case 'input':
        return {
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          color: '#e5e7eb',
          borderColor: '#374151',
        }
      default:
        return {
          backgroundColor: 'rgba(17, 24, 39, 0.95)', // dark gray-900 with high opacity
          color: '#e5e7eb', // gray-200 - bright text
          borderColor: '#374151', // gray-700
        }
    }
  }

  const handleConfirm = () => {
    if (toast.type === 'input' && toast.inputOnConfirm) {
      toast.inputOnConfirm(inputValue)
      handleRemove()
      return
    }
    if (toast.onConfirm) {
      toast.onConfirm()
    }
    handleRemove()
  }

  const handleCancel = () => {
    if (toast.onCancel) {
      toast.onCancel()
    }
    handleRemove()
  }

  const darkModeStyles = getDarkModeStyles()
  const isDarkMode = resolvedTheme === 'dark'
  
  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0 mt-0.5"
    const iconColor = isDarkMode && darkModeStyles.color 
      ? darkModeStyles.color 
      : undefined
    
    const iconStyle = iconColor ? { color: iconColor } : {}
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600`} style={iconStyle} />
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-600`} style={iconStyle} />
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-600`} style={iconStyle} />
      case 'info':
        return <Info className={`${iconClass} text-blue-600`} style={iconStyle} />
      case 'confirm':
        return <HelpCircle className={`${iconClass} text-orange-600`} style={iconStyle} />
      case 'new-chat-warning':
        return <Info className={`${iconClass} text-orange-600`} style={iconStyle} />
      case 'input':
        return <Info className={`${iconClass} text-blue-600`} style={iconStyle} />
      default:
        return <Info className={`${iconClass} text-gray-600`} style={iconStyle} />
    }
  }
  
  return (
    <div 
      className={`${getToastStyles()} ${getTypeStyles()} min-w-80 max-w-md flex justify-between`} 
      style={{
        border: isDarkMode && darkModeStyles.borderColor 
          ? `2px solid ${darkModeStyles.borderColor}` 
          : toast.type === 'confirm' || toast.type === 'new-chat-warning'
          ? '2px solid #f97316'
          : undefined,
        borderRadius: '12px',
        boxShadow: isDarkMode 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '1rem 2rem',
        ...darkModeStyles, // Apply dark mode styles (will override className colors)
      }}>
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 
          className="font-semibold text-sm leading-tight"
          style={isDarkMode ? { color: darkModeStyles.color } : {}}
        >
          {toast.title}
        </h4>
        {toast.message && (
          <p 
            className="text-sm mt-1 leading-relaxed"
            style={isDarkMode ? { 
              color: darkModeStyles.color,
              opacity: 0.95 // Slightly less opaque than title for hierarchy
            } : { opacity: 0.9 }}
          >
            {toast.message}
          </p>
        )}
        {toast.type === 'confirm' && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-semibold bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow-lg hover:shadow-xl hover:shadow-red-500/25 transition-all duration-200 transform hover:scale-105 active:scale-95 border border-red-500/20"
              style={{ 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem', 
                cursor: 'pointer',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {toast.confirmText || 'Delete'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-semibold bg-linear-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 border border-gray-300/50 dark:border-gray-600/50"
              style={{ 
                color: 'black', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem', 
                cursor: 'pointer',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {toast.cancelText || 'Cancel'}
            </button>
          </div>
        )}

        {toast.type === 'input' && (
          <div className="mt-3! space-y-3!">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={toast.inputPlaceholder || ''}
              className="w-full px-3! py-2! rounded-md! bg-white! dark:bg-gray-800! border! border-gray-300! dark:border-gray-600! text-sm! text-gray-900! dark:text-gray-100! outline-none! focus:ring-2! focus:ring-blue-500! shadow-inner!"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirm}
                className="px-4! py-2! text-sm! font-semibold! rounded-md! text-white! bg-emerald-600! hover:bg-emerald-700! active:bg-emerald-800! shadow-md! hover:shadow-lg! transition-all! duration-200!"
              >
                {toast.confirmText || 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4! py-2! text-sm! font-semibold! rounded-md! text-gray-800! dark:text-gray-200! bg-gray-100! hover:bg-gray-200! dark:bg-gray-700! dark:hover:bg-gray-600! border! border-gray-300/60! dark:border-gray-600/60! shadow-sm! hover:shadow-md! transition-all! duration-200!"
              >
                {toast.cancelText || 'Cancel'}
              </button>
            </div>
          </div>
        )}
        
        {toast.type === 'new-chat-warning' && (
          <div className="flex flex-row gap-2 mt-6" style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => {
                if (toast.onLogin) toast.onLogin()
                handleRemove()
              }}
              className="px-4 py-2 text-sm font-semibold bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-200 transform hover:scale-105 active:scale-95 border border-blue-500/20"
              style={{
                backgroundColor: isDarkMode ? '#2563eb' : undefined, // blue-600
                color: '#ffffff',
                borderColor: isDarkMode ? '#3b82f6' : undefined, // blue-500
                boxShadow: isDarkMode 
                  ? '0 10px 15px -3px rgba(37, 99, 235, 0.4), 0 4px 6px -2px rgba(37, 99, 235, 0.2)' 
                  : undefined,
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
            <button
              onClick={() => {
                if (toast.onSignup) toast.onSignup()
                handleRemove()
              }}
              className="px-4 py-2 text-sm font-semibold bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-200 transform hover:scale-105 active:scale-95 border border-green-500/20"
              style={{
                backgroundColor: isDarkMode ? '#16a34a' : undefined, // green-600
                color: '#ffffff',
                borderColor: isDarkMode ? '#22c55e' : undefined, // green-500
                boxShadow: isDarkMode 
                  ? '0 10px 15px -3px rgba(22, 163, 74, 0.4), 0 4px 6px -2px rgba(22, 163, 74, 0.2)' 
                  : undefined,
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              Sign Up
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-semibold bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow-lg hover:shadow-xl hover:shadow-red-500/25 transition-all duration-200 transform hover:scale-105 active:scale-95 border border-red-500/20"
              style={{
                backgroundColor: isDarkMode ? '#dc2626' : undefined, // red-600
                color: '#ffffff',
                borderColor: isDarkMode ? '#ef4444' : undefined, // red-500
                boxShadow: isDarkMode 
                  ? '0 10px 15px -3px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.2)' 
                  : undefined,
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              {toast.confirmText || 'Continue'}
            </button>
            {toast.onCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-semibold bg-linear-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 border border-gray-300/50 dark:border-gray-600/50"
                style={{
                  backgroundColor: isDarkMode ? '#374151' : undefined, // gray-700
                  color: isDarkMode ? '#f3f4f6' : undefined, // gray-100
                  borderColor: isDarkMode ? '#4b5563' : undefined, // gray-600
                  boxShadow: isDarkMode 
                    ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' 
                    : undefined,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                {toast.cancelText || 'Cancel'}
              </button>
            )}
          </div>
        )}
      </div>
      {toast.type !== 'confirm' && toast.type !== 'new-chat-warning' && (
        <button
          onClick={handleRemove}
          className="shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          aria-label="Close notification"
          style={isDarkMode ? {
            color: darkModeStyles.color,
            opacity: 0.8,
          } : {}}
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {toast.type === 'new-chat-warning' && (
        <button
          onClick={handleRemove}
          className="shrink-0 p-1 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
          aria-label="Close notification"
          style={isDarkMode ? {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#f3f4f6',
          } : {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  const hasConfirmToast = toasts.some(toast => toast.type === 'confirm')

  return (
    <>
      {/* Background blur overlay for confirmation toasts */}
      {hasConfirmToast && (
        <div 
          className="fixed inset-0 backdrop-blur-sm z-60 transition-all duration-300" 
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darker overlay for better contrast
          }}
        />
      )}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-70 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastComponent toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </>
  )
}

// Toast Hook
let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastId}`
    const newToast: Toast = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast
    }
    
    setToasts(prev => [...prev, newToast])
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, message?: string, duration?: number) => 
    addToast({ type: 'success', title, message, duration })
  
  const error = (title: string, message?: string, duration?: number) => 
    addToast({ type: 'error', title, message, duration })
  
  const warning = (title: string, message?: string, duration?: number) => 
    addToast({ type: 'warning', title, message, duration })
  
  const info = (title: string, message?: string, duration?: number) => 
    addToast({ type: 'info', title, message, duration })

  const confirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string) => 
    addToast({ 
      type: 'confirm', 
      title, 
      message, 
      onConfirm, 
      onCancel, 
      confirmText, 
      cancelText,
      duration: 0 // No auto-dismiss for confirm dialogs
    })

  const newChatWarning = (title: string, message: string, onConfirm: () => void, onCancel?: () => void, onLogin?: () => void, onSignup?: () => void, confirmText?: string, cancelText?: string) => 
    addToast({ 
      type: 'new-chat-warning', 
      title, 
      message, 
      onConfirm, 
      onCancel, 
      onLogin,
      onSignup,
      confirmText, 
      cancelText,
      duration: 0 // No auto-dismiss for warning dialogs
    })

  const input = (title: string, message: string, defaultValue: string, onConfirm: (value: string) => void, onCancel?: () => void, confirmText?: string, cancelText?: string, placeholder?: string) =>
    addToast({
      type: 'input',
      title,
      message,
      inputDefault: defaultValue,
      inputPlaceholder: placeholder,
      inputOnConfirm: onConfirm,
      onCancel,
      confirmText,
      cancelText,
      duration: 0
    })

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    confirm,
    newChatWarning,
    input
  }
}
