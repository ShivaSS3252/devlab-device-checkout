'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function Home() {
  const { user, isLoading, initializeAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace(user.role === 'admin' ? '/admin' : '/user')
      } else {
        router.replace('/login')
      }
    }
  }, [user, isLoading, router])

  return <LoadingSpinner />
}
