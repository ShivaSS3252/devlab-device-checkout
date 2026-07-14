'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useDeviceStore } from '@/store/useDeviceStore'
import { Device } from '@/domain/Device'
import { MAX_DEVICES_PER_USER } from '@/constants/borrowing'

const T = {
  bg:         '#0d1117',
  card:       '#161b22',
  border:     'rgba(255,255,255,0.09)',
  teal:       '#00d4aa',
  sky:        '#0ea5e9',
  textPri:    '#e6edf3',
  textSub:    'rgba(230,237,243,0.72)',
  textMuted:  'rgba(230,237,243,0.52)',
  inputBg:    'rgba(255,255,255,0.06)',
  inputBorder:'rgba(255,255,255,0.13)',
  rowHover:   'rgba(255,255,255,0.04)',
}

function StockBadge({ units }: { units: number }) {
  const cfg =
    units === 0 ? { label: 'Out of Stock', bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' } :
    units === 1 ? { label: 'Low Stock',    bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' } :
                  { label: 'Available',    bg: 'rgba(0,212,170,0.1)',   color: '#00d4aa', border: 'rgba(0,212,170,0.22)' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  )
}

export function UserDashboard() {
  const router = useRouter()
  const { user, initializeAuth, logout } = useAuthStore()
  const { devices, currentUser, error, setCurrentUser, checkout, returnDevice, clearError } = useDeviceStore()

  useEffect(() => { initializeAuth() }, [initializeAuth])
  useEffect(() => { if (user) setCurrentUser(user.id) }, [user, setCurrentUser])

  const handleLogout = async () => { await logout(); router.push('/login') }

  const handleCheckout = (deviceName: string) => {
    if (user) { clearError(); checkout(user.id, deviceName) }
  }
  const handleReturn = (deviceName: string) => {
    if (user) { clearError(); returnDevice(user.id, deviceName) }
  }

  const checkedOutCount = currentUser?.checkedOutDevices?.length || 0
  const checkedOutNames = currentUser?.checkedOutDevices || []
  const slotsLeft       = Math.max(0, MAX_DEVICES_PER_USER - checkedOutCount)

  const isCheckedOut = (name: string) => checkedOutNames.includes(name)

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.textPri }}>

      {/* ── Header ── */}
      <header style={{ background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${T.teal},${T.sky})`, boxShadow: `0 0 12px rgba(0,212,170,0.3)` }}>
              <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold" style={{ color: T.textPri }}>DevLab</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg,${T.teal},${T.sky})` }}>
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: T.textSub }}>{user.name}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(14,165,233,0.1)', color: T.sky, border: `1px solid rgba(14,165,233,0.22)` }}>
                user
              </span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textSub }}
              onMouseEnter={e => {
                const b = e.currentTarget
                b.style.background  = 'rgba(239,68,68,0.14)'
                b.style.borderColor = 'rgba(239,68,68,0.4)'
                b.style.color       = '#f87171'
              }}
              onMouseLeave={e => {
                const b = e.currentTarget
                b.style.background  = T.inputBg
                b.style.borderColor = T.inputBorder
                b.style.color       = T.textSub
              }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── Stats ── */}
        <div className="flex flex-wrap gap-4">
          {[
            { label: 'Checked Out', value: checkedOutCount, accent: T.teal    },
            { label: 'Slots Left',  value: slotsLeft,       accent: T.sky     },
            { label: 'Device Limit',value: MAX_DEVICES_PER_USER, accent: '#fbbf24' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 flex-1 min-w-[140px]"
              style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-xs font-medium mb-1 break-words" style={{ color: T.textMuted }}>{s.label}</p>
              <p className="text-2xl font-black break-words" style={{ color: s.accent }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── My Devices ── */}
        {checkedOutCount > 0 && (
          <div className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: '#fbbf24' }}>My Devices</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: checkedOutCount >= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                         color: checkedOutCount >= 2 ? '#f87171' : '#fbbf24',
                         border: `1px solid ${checkedOutCount >= 2 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                {checkedOutCount}/2 checked out
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {checkedOutNames.map((name: string) => (
                <div key={name} className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.14)',
                           flex: '0 1 calc(50% - 6px)', minWidth: '220px', boxSizing: 'border-box' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold break-words" style={{ color: T.textPri }}>{name}</p>
                    <p className="text-[11px] mt-0.5 break-words" style={{ color: T.textMuted }}>Checked out by you</p>
                  </div>
                  <button onClick={() => handleReturn(name)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.28)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.55)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}>
                    Return
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-medium text-red-400">{error}</p>
          </div>
        )}

        {/* ── Device Grid ── */}
        <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h2 className="text-sm font-bold" style={{ color: T.teal }}>Available Devices</h2>
            <span className="text-xs" style={{ color: T.textMuted }}>{devices.length} devices</span>
          </div>

          {devices.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: T.textMuted }}>No devices in inventory yet.</p>
            </div>
          ) : (
            <div className="p-5 flex flex-wrap gap-4">
              {devices.map((device: Device) => {
                const checked = isCheckedOut(device.name)
                const atLimit = checkedOutCount >= MAX_DEVICES_PER_USER

                return (
                  <div key={device.name}
                    className="rounded-xl p-4 flex flex-col gap-3 transition-all"
                    style={{ background: checked ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.025)',
                             border: checked ? '1px solid rgba(239,68,68,0.15)' : `1px solid ${T.border}`,
                             flex: '0 1 calc(33.333% - 11px)', minWidth: '220px', boxSizing: 'border-box' }}>

                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold leading-tight break-words flex-1 min-w-0" style={{ color: T.textPri }}>{device.name}</p>
                      <StockBadge units={device.units} />
                    </div>

                    <p className="text-[11px] break-words" style={{ color: T.textMuted }}>
                      {device.units === 0 ? 'No units available' :
                       device.units === 1 ? '1 unit available' :
                       `${device.units} units available`}
                    </p>

                    {atLimit && !checked ? (
                      <button disabled
                        className="w-full py-2 rounded-lg text-xs font-semibold cursor-not-allowed"
                        style={{ background: T.inputBg, color: T.textMuted, border: `1px solid ${T.inputBorder}` }}>
                        Limit Reached
                      </button>
                    ) : checked ? (
                      <button onClick={() => handleReturn(device.name)}
                        className="w-full py-2 rounded-lg text-xs font-semibold transition-all duration-150"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.28)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.55)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)' }}>
                        Return
                      </button>
                    ) : (
                      <button onClick={() => handleCheckout(device.name)}
                        disabled={device.units === 0}
                        className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: `linear-gradient(135deg,${T.teal},${T.sky})`, boxShadow: '0 2px 8px rgba(0,212,170,0.2)' }}
                        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,212,170,0.5)' }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,212,170,0.2)' }}>
                        {device.units === 0 ? 'Out of Stock' : 'Checkout'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
