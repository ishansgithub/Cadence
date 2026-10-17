import { createContext } from 'react'

export type ToastItem = {
  id: string
  message: string
}

export type ToastContextValue = {
  showError: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
