'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { ToastMessage, ToastContainer } from '../components/Toast'

interface ToastContextType {
  showToast: (type: ToastMessage['type'], title: string, message?: string, duration?: number) => void
  showError: (title: string, message?: string) => void
  showSuccess: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: ToastMessage['type'], title: string, message?: string, duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration
    }

    setToasts(prev => [...prev, toast])
  }

  const showError = (title: string, message?: string) => {
    showToast('error', title, message)
  }

  const showSuccess = (title: string, message?: string) => {
    showToast('success', title, message, 3000)
  }

  const showWarning = (title: string, message?: string) => {
    showToast('warning', title, message)
  }

  const showInfo = (title: string, message?: string) => {
    showToast('info', title, message)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const value: ToastContextType = {
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}
