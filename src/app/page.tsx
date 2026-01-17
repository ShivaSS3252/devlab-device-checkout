'use client'

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { initializeAuth } from '@/store/authSlice'
import { initializeLibrary } from '@/store/librarySlice'
import { LoginPage } from '@/components/LoginPage'
import { UserDashboard } from '@/components/UserDashboard'
import { AdminDashboard } from '@/components/AdminDashboard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Book } from '@/domain/Book'
import { User } from '@/domain/User'

export default function Home() {
  const dispatch = useAppDispatch()
  const { user, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Initialize auth state
    dispatch(initializeAuth())

    // Initialize library with some sample data
    const sampleBooks = [
      new Book('The Clean Coder', 3),
      new Book('Clean Code', 2),
      new Book('Design Patterns', 1),
      new Book('Refactoring', 2),
      new Book('Domain-Driven Design', 1)
    ]

    const sampleUsers = [
      new User('user1', 'John Doe'),
      new User('admin1', 'Admin User')
    ]

    dispatch(initializeLibrary({ books: sampleBooks, users: sampleUsers }))
  }, [dispatch])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginPage />
  }

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />
}
