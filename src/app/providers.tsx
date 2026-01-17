'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'
import { ToastProvider } from '@/contexts/ToastContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </Provider>
    </ErrorBoundary>
  )
}
