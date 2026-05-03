import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const addDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(15, 'Name must be 15 characters or less'),
  units: z.number({ error: 'Units must be a number' }).int().min(1, 'At least 1 unit required'),
})

export type AddDeviceFormData = z.infer<typeof addDeviceSchema>

export const addUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['user', 'admin']),
})

export type AddUserFormData = z.infer<typeof addUserSchema>
