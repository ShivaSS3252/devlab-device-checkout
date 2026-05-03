import bcrypt from 'bcryptjs'
import { UserRole } from '@/types/auth'

export interface HardcodedUser {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  passwordHash: string
}

// Passwords: admin → admin123 | john → john123 | jane → jane123
export const HARDCODED_USERS: HardcodedUser[] = [
  {
    id: 'admin1',
    username: 'admin',
    name: 'Admin User',
    email: 'admin@devlab.com',
    role: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
  },
  {
    id: 'user1',
    username: 'john',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    passwordHash: bcrypt.hashSync('john123', 10),
  },
  {
    id: 'user2',
    username: 'jane',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    passwordHash: bcrypt.hashSync('jane123', 10),
  },
]
