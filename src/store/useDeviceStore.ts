'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Device } from '@/domain/Device'
import { User } from '@/domain/User'
import { DevLab } from '@/domain/DevLab'
import { DevLabService } from '@/services/DevLabService'
import { CheckoutLimitError } from '@/errors/CheckoutLimitError'
import { DuplicateCheckoutError } from '@/errors/DuplicateCheckoutError'

interface RawDevice { name: string; units: number }
interface RawUser { id: string; name: string; checkedOutDevices?: string[] }

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

const toDevice = (d: RawDevice): Device => new Device(d.name, d.units)
const toUser = (u: RawUser): User => new User(u.id, u.name, [...(u.checkedOutDevices || [])])

interface DeviceState {
  devices: Device[]
  users: User[]
  currentUser: User | null
  isLoading: boolean
  error: string | null
}

interface DeviceActions {
  setCurrentUser: (userId: string) => void
  checkout: (userId: string, deviceName: string) => void
  returnDevice: (userId: string, deviceName: string) => void
  addDevice: (device: Device) => void
  addUser: (user: User) => void
  clearError: () => void
  resetCurrentUser: () => void
}

export const useDeviceStore = create<DeviceState & DeviceActions>()(
  persist(
    (set, get) => ({
      devices: SAMPLE_DEVICES,
      users: SAMPLE_USERS,
      currentUser: null,
      isLoading: false,
      error: null,

      setCurrentUser: (userId: string) => {
        const { users } = get()
        const raw = users.find((u) => u.id === userId)
        if (raw) {
          set({ currentUser: toUser(raw) })
        }
      },

      checkout: (userId: string, deviceName: string) => {
        const { devices, users } = get()
        try {
          const rawUser = users.find((u) => u.id === userId)
          const rawDevice = devices.find((d) => d.name === deviceName)

          if (!rawUser) throw new Error('User not found')
          if (!rawDevice || rawDevice.units === 0) throw new Error('Device not available')

          const user = toUser(rawUser)

          if (user.checkedOutDevices.length >= 2) throw new CheckoutLimitError()
          if (user.checkedOutDevices.includes(deviceName)) throw new DuplicateCheckoutError()

          const updatedDevices = devices
            .map((d) => toDevice({ name: d.name, units: d.name === deviceName ? d.units - 1 : d.units }))
            .filter((d: Device) => d.units > 0)

          const updatedUser = new User(rawUser.id, rawUser.name, [...rawUser.checkedOutDevices, deviceName])
          const updatedUsers = users.map((u) => u.id === userId ? updatedUser : toUser(u))

          set({ devices: updatedDevices, users: updatedUsers, currentUser: updatedUser, error: null })
        } catch (error) {
          if (error instanceof CheckoutLimitError) {
            set({ error: 'Checkout limit exceeded (max 2 devices)' })
          } else if (error instanceof DuplicateCheckoutError) {
            set({ error: 'You cannot checkout the same device twice' })
          } else {
            set({ error: 'Failed to checkout device' })
          }
        }
      },

      returnDevice: (userId: string, deviceName: string) => {
        const { devices, users } = get()
        try {
          const domainDevices = devices.map(toDevice)
          const domainUsers = users.map(toUser)
          const service = new DevLabService(new DevLab(domainDevices, domainUsers))
          const updated = service.returnDevice(userId, deviceName)

          set({
            devices: [...updated.getDevices()],
            users: [...updated.getUsers()],
            currentUser: updated.getUser(userId) || null,
            error: null,
          })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to return device' })
        }
      },

      addDevice: (device: Device) => {
        const { devices } = get()
        const existing = devices.find((d) => d.name === device.name)
        const updatedDevices = existing
          ? devices.map((d) =>
              d.name === device.name ? new Device(d.name, d.units + device.units) : toDevice(d)
            )
          : [...devices.map(toDevice), device]
        set({ devices: updatedDevices })
      },

      addUser: (user: User) => {
        const { users } = get()
        set({ users: [...users, user] })
      },

      clearError: () => set({ error: null }),

      resetCurrentUser: () => set({ currentUser: null }),
    }),
    {
      name: 'devlab_state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ devices: state.devices, users: state.users }),
      merge: (persistedState: unknown, currentState: DeviceState & DeviceActions): DeviceState & DeviceActions => {
        const ps = persistedState as { devices?: RawDevice[]; users?: RawUser[] }

        if (!ps.devices || ps.devices.length === 0) {
          return { ...currentState, devices: SAMPLE_DEVICES, users: SAMPLE_USERS }
        }

        const restoredDevices = ps.devices.map((d) => new Device(d.name, d.units))
        const restoredUsers = ps.users?.map((u) => new User(u.id, u.name, u.checkedOutDevices ?? [])) ?? [...SAMPLE_USERS]

        // Ensure sample users still exist after restore
        const savedIds = new Set(restoredUsers.map((u) => u.id))
        SAMPLE_USERS.forEach((su) => {
          if (!savedIds.has(su.id)) restoredUsers.push(su)
        })

        return { ...currentState, devices: restoredDevices, users: restoredUsers }
      },
    }
  )
)
