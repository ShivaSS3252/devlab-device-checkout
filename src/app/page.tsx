'use client'

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { initializeAuth } from '@/store/authSlice'
import { initializeDevLab } from '@/store/librarySlice'
import { LoginPage } from '@/components/LoginPage'
import { UserDashboard } from '@/components/UserDashboard'
import { AdminDashboard } from '@/components/AdminDashboard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Device } from '@/domain/Device'
import { User } from '@/domain/User'

export default function Home() {
  const dispatch = useAppDispatch()
  const { user, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Initialize auth state
    dispatch(initializeAuth())

    // Initialize DevLab with sample test devices
    const sampleBooks = [
      new Device('iPhone 15 Pro', 3),
      new Device('Samsung Galaxy S24', 2),
      new Device('iPad Pro 12.9', 1),
      new Device('Google Pixel 8', 2),
      new Device('MacBook Pro 14', 1)
    ]

    const sampleUsers = [
      new User('user1', 'John Doe'),
      new User('admin1', 'Admin User')
    ]

    dispatch(initializeDevLab({ books: sampleBooks, users: sampleUsers }))
  }, [dispatch])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginPage />
  }

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />
}
