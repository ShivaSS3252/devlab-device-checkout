import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { HARDCODED_USERS } from '@/config/users'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'devlab-secret-key-change-in-production'
)

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const found = HARDCODED_USERS.find((u) => u.username === username)
    if (!found) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, found.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const token = await new SignJWT({ userId: found.id, role: found.role, name: found.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    const user = { id: found.id, name: found.name, email: found.email, role: found.role }

    const response = NextResponse.json({ user, token }, { status: 200 })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
