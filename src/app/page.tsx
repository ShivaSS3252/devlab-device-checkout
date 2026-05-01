'use client'

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { initializeAuth } from '@/store/authSlice'
import { initializeDevLab, setCurrentUser } from '@/store/deviceSlice'
import { LoginPage } from '@/components/LoginPage'
import { UserDashboard } from '@/components/UserDashboard'
import { AdminDashboard } from '@/components/AdminDashboard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Device } from '@/domain/Device'
import { User } from '@/domain/User'

const SAMPLE_DEVICES = [
  new Device('iPhone 15 Pro', 3),
  new Device('Samsung Galaxy S24', 2),
  new Device('iPad Pro 12.9', 1),
  new Device('Google Pixel 8', 2),
  new Device('MacBook Pro 14', 1),
]

const SAMPLE_USERS = [
  new User('user1', 'John Doe'),
  new User('user2', 'Jane Smith'),
  new User('admin1', 'Admin User'),
]

export default function Home() {
  const dispatch = useAppDispatch()
  const { user, isLoading } = useAppSelector((state) => state.auth)
  const { devices, users } = useAppSelector((state) => state.devlab)

  // Persist devlab state to localStorage whenever devices or users change
  useEffect(() => {
    if (typeof window !== 'undefined' && devices.length > 0) {
      localStorage.setItem('devlab_state', JSON.stringify({ devices, users }))
    }
  }, [devices, users])

  // Restore currentUser as a proper class instance whenever the auth user or users list changes.
  // This covers both normal login and page-refresh restoration.
  useEffect(() => {
    if (user && users.length > 0) {
      const raw = users.find((u: any) => u.id === user.id)
      if (raw) {
        dispatch(setCurrentUser(new User(raw.id, raw.name, [...(raw.checkedOutDevices || [])])))
      }
    }
  }, [user, users, dispatch])

  useEffect(() => {
    dispatch(initializeAuth())

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('devlab_state')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          const restoredDevices = (data.devices as any[]).map(
            (d: any) => new Device(d.name, d.units)
          )
          const restoredUsers = (data.users as any[]).map(
            (u: any) => new User(u.id, u.name, u.checkedOutDevices || [])
          )
          // Ensure any new sample users added after the save still exist
          const savedIds = new Set(restoredUsers.map((u: User) => u.id))
          SAMPLE_USERS.forEach((su) => {
            if (!savedIds.has(su.id)) restoredUsers.push(su)
          })
          dispatch(initializeDevLab({ devices: restoredDevices, users: restoredUsers }))
          return
        } catch {
          // corrupt saved data — fall through to sample data
        }
      }
    }

    dispatch(initializeDevLab({ devices: SAMPLE_DEVICES, users: SAMPLE_USERS }))
  }, [dispatch])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginPage />
  }

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />
}
