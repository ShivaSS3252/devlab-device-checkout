'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/useAuthStore'
import { useDeviceStore } from '@/store/useDeviceStore'
import { Device } from '@/domain/Device'
import { User } from '@/domain/User'
import { useToast } from '@/contexts/ToastContext'
import { Pagination } from './Pagination'
import { ITEMS_PER_PAGE } from '@/constants/borrowing'
import { addDeviceSchema, AddDeviceFormData } from '@/lib/schemas'

// ── shared dark-theme tokens ─────────────────────────────────────────────────
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

function StatusBadge({ units }: { units: number }) {
  const cfg =
    units === 0 ? { label: 'Out of Stock', bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' } :
    units === 1 ? { label: 'Low Stock',    bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' } :
                  { label: 'Available',    bg: 'rgba(0,212,170,0.1)',   color: '#00d4aa', border: 'rgba(0,212,170,0.22)' }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  )
}

function UserStatusBadge({ count }: { count: number }) {
  const cfg =
    count >= 2 ? { label: 'At Limit', bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' } :
    count === 1 ? { label: 'Active',   bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' } :
                  { label: 'Free',     bg: 'rgba(0,212,170,0.1)',   color: '#00d4aa', border: 'rgba(0,212,170,0.22)' }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  )
}

export function AdminDashboard() {
  const router = useRouter()
  const { user, initializeAuth, logout } = useAuthStore()
  const { devices, users, currentUser, error, setCurrentUser, checkout, returnDevice, addDevice, clearError } = useDeviceStore()
  const { showError, showSuccess } = useToast()

  const [showAddDevice, setShowAddDevice] = useState(false)
  const [devicesPage, setDevicesPage]   = useState(1)
  const [usersPage,   setUsersPage]     = useState(1)
  const [availPage,   setAvailPage]     = useState(1)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddDeviceFormData>({
    resolver: zodResolver(addDeviceSchema),
    defaultValues: { name: '', units: 1 },
  })

  useEffect(() => { initializeAuth() }, [initializeAuth])
  useEffect(() => { if (user) setCurrentUser(user.id) }, [user, setCurrentUser])
  useEffect(() => {
    if (error) { showError('Operation Failed', error); clearError() }
  }, [error, showError, clearError])

  const handleLogout = async () => { await logout(); router.push('/login') }

  const onAddDevice = (data: AddDeviceFormData) => {
    addDevice(new Device(data.name.trim(), data.units))
    reset({ name: '', units: 1 })
    setShowAddDevice(false)
    showSuccess('Device added successfully')
  }

  const adminCheckedOut = currentUser?.checkedOutDevices || []

  const handleCheckout = (deviceName: string) => {
    if (user) { clearError(); checkout(user.id, deviceName); showSuccess(`Checked out "${deviceName}"`) }
  }
  const handleReturn = (deviceName: string) => {
    if (user) { clearError(); returnDevice(user.id, deviceName); showSuccess(`Returned "${deviceName}"`) }
  }

  const totalUnits    = devices.reduce((s: number, d: Device) => s + d.units, 0)
  const checkedOutAll = users.reduce((s: number, u: User) => s + u.checkedOutDevices.length, 0)
  const activeUsers   = users.filter((u: User) => u.checkedOutDevices.length > 0).length

  const availableDevices    = devices.filter((d: Device) => d.units > 0 && !adminCheckedOut.includes(d.name))
  const devicesToDisplay    = devices.slice((devicesPage - 1) * ITEMS_PER_PAGE, devicesPage * ITEMS_PER_PAGE)
  const usersToDisplay      = users.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)
  const availToDisplay      = availableDevices.slice((availPage - 1) * ITEMS_PER_PAGE, availPage * ITEMS_PER_PAGE)

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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm font-bold" style={{ color: T.textPri }}>DevLab Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg,${T.teal},${T.sky})` }}>
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: T.textSub }}>{user.name}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,212,170,0.1)', color: T.teal, border: `1px solid rgba(0,212,170,0.22)` }}>
                admin
              </span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.textSub }}
              onMouseEnter={e => {
                const b = e.currentTarget
                b.style.background = 'rgba(239,68,68,0.14)'
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Device Models', value: devices.length,    accent: T.teal },
            { label: 'Total Units',   value: totalUnits,         accent: T.sky  },
            { label: 'Checked Out',   value: checkedOutAll,      accent: '#fbbf24' },
            { label: 'Active Users',  value: activeUsers,        accent: '#f87171' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4"
              style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <p className="text-xs font-medium mb-1" style={{ color: T.textMuted }}>{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.accent }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── My Checkouts ── */}
        <div className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold" style={{ color: T.teal }}>My Checkouts</h2>
              <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>2-device limit applies to you too</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,212,170,0.08)', color: T.teal, border: `1px solid rgba(0,212,170,0.18)` }}>
              {adminCheckedOut.length}/2 checked out
            </span>
          </div>

          {adminCheckedOut.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {adminCheckedOut.map((name: string) => (
                <div key={name} className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: T.textPri }}>{name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>Checked out by you</p>
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
          )}

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1rem' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: T.textMuted }}>
              Available to checkout ({availableDevices.length})
            </p>
            {availableDevices.length === 0 ? (
              <p className="text-xs" style={{ color: T.textMuted }}>No devices available or limit reached.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availToDisplay.map((device: Device) => (
                    <div key={device.name} className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'rgba(0,212,170,0.04)', border: `1px solid rgba(0,212,170,0.12)` }}>
                      <div className="min-w-0 mr-3">
                        <p className="text-xs font-semibold truncate" style={{ color: T.textPri }}>{device.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>{device.units} units</p>
                      </div>
                      <button onClick={() => handleCheckout(device.name)}
                        disabled={adminCheckedOut.length >= 2}
                        className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: `linear-gradient(135deg,${T.teal},${T.sky})`, color: '#fff', boxShadow: '0 0 0 0 transparent' }}
                        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = `0 0 12px rgba(0,212,170,0.45)` }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 0 transparent' }}>
                        Checkout
                      </button>
                    </div>
                  ))}
                </div>
                {Math.ceil(availableDevices.length / ITEMS_PER_PAGE) > 1 && (
                  <div className="mt-3">
                    <Pagination currentPage={availPage} totalPages={Math.ceil(availableDevices.length / ITEMS_PER_PAGE)}
                      onPageChange={setAvailPage} disabled={false} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Add Device ── */}
        <div className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold" style={{ color: T.sky }}>Manage Inventory</h2>
              <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>Add new devices to the collection</p>
            </div>
            <button
              onClick={() => { setShowAddDevice(!showAddDevice); reset() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{ background: showAddDevice ? T.inputBg : `linear-gradient(135deg,${T.teal},${T.sky})`,
                       color: showAddDevice ? T.textSub : '#fff',
                       border: showAddDevice ? `1px solid ${T.inputBorder}` : 'none',
                       boxShadow: showAddDevice ? 'none' : '0 2px 10px rgba(0,212,170,0.25)' }}
              onMouseEnter={e => { if (!showAddDevice) e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,212,170,0.5)' }}
              onMouseLeave={e => { if (!showAddDevice) e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,212,170,0.25)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d={showAddDevice ? 'M6 18L18 6M6 6l12 12' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'} />
              </svg>
              {showAddDevice ? 'Cancel' : 'Add Device'}
            </button>
          </div>

          {showAddDevice && (
            <form onSubmit={handleSubmit(onAddDevice)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4"
              style={{ borderTop: `1px solid ${T.border}` }}>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: T.textMuted }}>Device Name</label>
                <input {...register('name')} maxLength={15} autoComplete="off"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: T.inputBg, border: errors.name ? '1.5px solid #ef4444' : `1.5px solid ${T.inputBorder}`, color: T.textPri }} />
                {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: T.textMuted }}>Units</label>
                <input type="number" min="1" {...register('units', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: T.inputBg, border: errors.units ? '1.5px solid #ef4444' : `1.5px solid ${T.inputBorder}`, color: T.textPri }} />
                {errors.units && <p className="mt-1 text-[11px] text-red-400">{errors.units.message}</p>}
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-150"
                  style={{ background: `linear-gradient(135deg,${T.teal},${T.sky})`, boxShadow: '0 2px 10px rgba(0,212,170,0.25)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 18px rgba(0,212,170,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,212,170,0.25)' }}>
                  Add Device
                </button>
                <button type="button" onClick={() => { setShowAddDevice(false); reset() }}
                  className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{ background: T.inputBg, color: T.textSub, border: `1px solid ${T.inputBorder}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = T.textPri }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.inputBg; e.currentTarget.style.color = T.textSub }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Device Inventory Table ── */}
        <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h2 className="text-sm font-bold" style={{ color: '#fbbf24' }}>Device Inventory</h2>
            <span className="text-xs" style={{ color: T.textMuted }}>{devices.length} models</span>
          </div>

          {devices.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: T.textMuted }}>No devices yet. Add some above.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {['Device Name','Units','Status'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left font-semibold uppercase tracking-wider"
                          style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {devicesToDisplay.map((d: Device) => (
                      <tr key={d.name} className="transition-colors"
                        style={{ borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-5 py-3 font-semibold" style={{ color: T.textPri }}>{d.name}</td>
                        <td className="px-5 py-3" style={{ color: T.textSub }}>{d.units}</td>
                        <td className="px-5 py-3"><StatusBadge units={d.units} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3">
                <Pagination currentPage={devicesPage} totalPages={Math.ceil(devices.length / ITEMS_PER_PAGE)}
                  onPageChange={setDevicesPage} disabled={false} />
              </div>
            </>
          )}
        </div>

        {/* ── User Activity Table ── */}
        <div className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h2 className="text-sm font-bold" style={{ color: '#fb7185' }}>User Activity</h2>
            <span className="text-xs" style={{ color: T.textMuted }}>{users.length} users</span>
          </div>

          {users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: T.textMuted }}>No users registered.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {['User','Checked Out','Devices','Status'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left font-semibold uppercase tracking-wider"
                          style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usersToDisplay.map((u: User) => (
                      <tr key={u.id} className="transition-colors"
                        style={{ borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.rowHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                              style={{ background: `linear-gradient(135deg,${T.teal},${T.sky})` }}>
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-semibold" style={{ color: T.textPri }}>{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3" style={{ color: T.textSub }}>{u.checkedOutDevices.length}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.checkedOutDevices.length === 0
                              ? <span style={{ color: T.textMuted }}>—</span>
                              : u.checkedOutDevices.map((name: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium"
                                    style={{ background: 'rgba(0,212,170,0.08)', color: T.teal, border: `1px solid rgba(0,212,170,0.18)` }}>
                                    {name}
                                  </span>
                                ))}
                          </div>
                        </td>
                        <td className="px-5 py-3"><UserStatusBadge count={u.checkedOutDevices.length} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3">
                <Pagination currentPage={usersPage} totalPages={Math.ceil(users.length / ITEMS_PER_PAGE)}
                  onPageChange={setUsersPage} disabled={false} />
              </div>
            </>
          )}
        </div>

      </main>
    </div>
  )
}
