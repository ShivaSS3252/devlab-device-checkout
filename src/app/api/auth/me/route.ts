import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { HARDCODED_USERS } from '@/config/users'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'devlab-secret-key-change-in-production'
)

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const found = HARDCODED_USERS.find((u) => u.id === payload.userId)
    if (!found) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const user = { id: found.id, name: found.name, email: found.email, role: found.role }
    return NextResponse.json({ user, token }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}
