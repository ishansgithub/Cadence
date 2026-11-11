import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'
import { ToastProvider } from './components/ToastProvider'
import { queryClient } from './data/query-client'
import { AuthProvider } from './features/auth/AuthProvider'
import './index.css'
import './pwa'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root is missing')
}

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MotionConfig>
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
)
