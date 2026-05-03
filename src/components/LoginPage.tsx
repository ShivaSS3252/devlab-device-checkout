'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/useAuthStore'
import { loginSchema, LoginFormData } from '@/lib/schemas'

const CREDENTIALS = [
  { role: 'Admin',      user: 'admin', pass: 'admin123', icon: '⚙️', tag: 'admin' },
  { role: 'John Doe',   user: 'john',  pass: 'john123',  icon: '👤', tag: 'user'  },
  { role: 'Jane Smith', user: 'jane',  pass: 'jane123',  icon: '👤', tag: 'user'  },
]

export function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, user, clearError } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (user) router.replace(user.role === 'admin' ? '/admin' : '/user')
  }, [user, router])

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    await login(data.username, data.password)
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row" style={{ background: '#0d1117' }}>

      {/* ── LEFT: brand panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[52%] h-full flex-col justify-between px-12 py-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0d1117 0%, #0a1628 55%, #051020 100%)' }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#00d4aa 1px,transparent 1px),linear-gradient(90deg,#00d4aa 1px,transparent 1px)',
            backgroundSize: '36px 36px',
          }} />
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-[-80px] w-72 h-72 rounded-full blur-3xl opacity-[0.12] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#00d4aa,transparent)' }} />
        <div className="absolute bottom-1/4 right-[-50px] w-52 h-52 rounded-full blur-3xl opacity-[0.08] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#0ea5e9,transparent)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#00d4aa,#0ea5e9)', boxShadow: '0 0 16px rgba(0,212,170,0.35)' }}>
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-white text-base font-bold tracking-tight">DevLab</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.22)', color: '#00d4aa' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Device Checkout System
          </div>
          <h1 className="text-4xl font-black text-white leading-[1.12] mb-4 tracking-tight">
            Manage your<br />
            <span style={{ color: '#00d4aa' }}>test devices</span><br />
            <span className="text-3xl font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>effortlessly.</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Borrow, track and return devices for your frontend and mobile dev team.
          </p>
        </div>

        {/* Demo credentials */}
        <div className="relative z-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}>
            Demo accounts
          </p>
          <div className="flex flex-col gap-2">
            {CREDENTIALS.map((c) => (
              <div key={c.user}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-base">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{c.role}</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                    {c.user} / {c.pass}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ background: 'rgba(0,212,170,0.08)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.16)' }}>
                  {c.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: sign-in panel ── */}
      <div className="w-full lg:w-[48%] h-full flex items-center justify-center px-6 py-8"
        style={{ background: '#f0f4f8' }}>

        <div className="w-full max-w-xs">

          {/* Mobile: logo + mini demo creds row */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="h-7 w-7 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00d4aa,#0ea5e9)' }}>
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-900 text-base font-bold">DevLab</span>
            </div>
            {/* Compact credential pills on mobile */}
            <div className="flex gap-2 justify-center">
              {CREDENTIALS.map((c) => (
                <div key={c.user} className="flex-1 rounded-lg px-2 py-2 text-center bg-white border border-slate-200">
                  <p className="text-[10px] font-bold text-gray-600">{c.role.split(' ')[0]}</p>
                  <p className="text-[9px] font-mono text-gray-400 mt-0.5 leading-tight">{c.user}<br />{c.pass}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sign in</h2>
            <p className="mt-0.5 text-xs" style={{ color: '#64748b' }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>

            {/* Username */}
            <div>
              <label htmlFor="username"
                className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: '#475569' }}>
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="off"
                {...register('username')}
                placeholder="e.g. admin"
                className="w-full px-3.5 py-2.5 rounded-xl text-gray-900 text-sm outline-none transition-all"
                style={{
                  background: '#fff',
                  border: errors.username ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                  boxShadow: errors.username ? '0 0 0 3px rgba(239,68,68,0.07)' : 'none',
                }}
              />
              {errors.username && (
                <p className="mt-1 text-[11px] font-medium text-red-500">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password"
                className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: '#475569' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-gray-900 text-sm outline-none transition-all"
                  style={{
                    background: '#fff',
                    border: errors.password ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                    boxShadow: errors.password ? '0 0 0 3px rgba(239,68,68,0.07)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] font-medium text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* API error */}
            {error && (
              <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl"
                style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                <svg className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-medium text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#00d4aa,#0ea5e9)',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(0,212,170,0.3)',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <p className="mt-6 text-[11px] text-center" style={{ color: '#94a3b8' }}>
            DevLab · Test Device Checkout System
          </p>
        </div>
      </div>
    </div>
  )
}
