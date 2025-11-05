'use client'

import { createContext, useContext, ReactNode } from 'react'
import { ToastContainer, useToast, Toast } from './Toast'

interface ToastContextType {
  success: (title: string, message?: string, duration?: number) => string
  error: (title: string, message?: string, duration?: number) => string
  warning: (title: string, message?: string, duration?: number) => string
  info: (title: string, message?: string, duration?: number) => string
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string) => string
  newChatWarning: (title: string, message: string, onConfirm: () => void, onCancel?: () => void, onLogin?: () => void, confirmText?: string, cancelText?: string) => string
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}
