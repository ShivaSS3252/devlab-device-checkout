'use client'

import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchDevicesAsync, addDeviceAsync, checkoutDeviceAsync, returnDeviceAsync } from '@/store/librarySlice'
import { logoutAsync } from '@/store/authSlice'
import { Device } from '@/domain/Device'
import { User } from '@/domain/User'
import { useToast } from '@/contexts/ToastContext'
import { Pagination } from './Pagination'
import { ITEMS_PER_PAGE } from '@/constants/borrowing'

export function AdminDashboard() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { books, users, currentUser, isLoading, error } = useAppSelector((state) => state.devlab)
  const { showError, showSuccess } = useToast()

  const [newDeviceName, setNewDeviceName] = useState('')
  const [newDeviceUnits, setNewDeviceUnits] = useState(1)
  const [showAddDevice, setShowAddDevice] = useState(false)

  // Pagination states
  const [devicesCurrentPage, setDevicesCurrentPage] = useState(1)
  const [usersCurrentPage, setUsersCurrentPage] = useState(1)
  const [availableDevicesCurrentPage, setAvailableDevicesCurrentPage] = useState(1)

  useEffect(() => {
    dispatch(fetchDevicesAsync())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      showError('Operation Failed', error)
    }
  }, [error, showError])

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newDeviceName.trim()) {
      await dispatch(addDeviceAsync(new Device(newDeviceName.trim(), newDeviceUnits)))
      setNewDeviceName('')
      setNewDeviceUnits(1)
      setShowAddDevice(false)
      showSuccess('Device added successfully')
    }
  }

  const handleAdminCheckout = async (deviceName: string) => {
    if (user) {
      await dispatch(checkoutDeviceAsync({ userId: user.id, bookTitle: deviceName }))
      showSuccess(`Successfully checked out "${deviceName}"`)
    }
  }

  const handleAdminReturn = async (deviceName: string) => {
    if (user) {
      await dispatch(returnDeviceAsync({ userId: user.id, bookTitle: deviceName }))
      showSuccess(`Successfully returned "${deviceName}"`)
    }
  }

  const getTotalUnits = () => books.reduce((total: number, device: Device) => total + device.units, 0)
  const getCheckedOutCount = () => users.reduce((total: number, u: User) => total + u.checkedOutDevices.length, 0)
  const getActiveUsers = () => users.filter((u: User) => u.checkedOutDevices.length > 0).length

  const getAdminCheckedOut = () => {
    return currentUser?.checkedOutDevices || []
  }

  // Pagination calculations
  const devicesTotalPages = Math.ceil(books.length / ITEMS_PER_PAGE)
  const devicesStartIndex = (devicesCurrentPage - 1) * ITEMS_PER_PAGE
  const devicesEndIndex = devicesStartIndex + ITEMS_PER_PAGE
  const devicesToDisplay = books.slice(devicesStartIndex, devicesEndIndex)

  const usersTotalPages = Math.ceil(users.length / ITEMS_PER_PAGE)
  const usersStartIndex = (usersCurrentPage - 1) * ITEMS_PER_PAGE
  const usersEndIndex = usersStartIndex + ITEMS_PER_PAGE
  const usersToDisplay = users.slice(usersStartIndex, usersEndIndex)

  const availableDevices = books.filter(device => device.units > 0 && !getAdminCheckedOut().includes(device.name))
  const availableDevicesTotalPages = Math.ceil(availableDevices.length / ITEMS_PER_PAGE)
  const availableDevicesStartIndex = (availableDevicesCurrentPage - 1) * ITEMS_PER_PAGE
  const availableDevicesEndIndex = availableDevicesStartIndex + ITEMS_PER_PAGE
  const availableDevicesToDisplay = availableDevices.slice(availableDevicesStartIndex, availableDevicesEndIndex)

  const handleDevicesPageChange = (page: number) => {
    setDevicesCurrentPage(page)
  }

  const handleUsersPageChange = (page: number) => {
    setUsersCurrentPage(page)
  }

  const handleAvailableDevicesPageChange = (page: number) => {
    setAvailableDevicesCurrentPage(page)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">DevLab Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{user.name.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Welcome, {user.name}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Admin
                </span>
              </div>
              <button
                onClick={() => dispatch(logoutAsync())}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Total Devices</h3>
                  <p className="text-3xl font-bold text-blue-600">{books.length}</p>
                  <p className="text-sm text-gray-500">Device models</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Total Units</h3>
                  <p className="text-3xl font-bold text-green-600">{getTotalUnits()}</p>
                  <p className="text-sm text-gray-500">Available units</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Checked Out</h3>
                  <p className="text-3xl font-bold text-yellow-600">{getCheckedOutCount()}</p>
                  <p className="text-sm text-gray-500">Currently checked out</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Active Users</h3>
                  <p className="text-3xl font-bold text-purple-600">{getActiveUsers()}</p>
                  <p className="text-sm text-gray-500">With active checkouts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Personal Checkout */}
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Checkouts</h2>
                <p className="text-gray-600 mt-1">Checkout and return devices like any user (2-device limit applies)</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getAdminCheckedOut().length >= 2 ? 'bg-red-400' : getAdminCheckedOut().length === 1 ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`}></div>
                <span className="text-sm font-medium text-gray-600">{getAdminCheckedOut().length}/2 devices checked out</span>
              </div>
            </div>

            {/* Admin Checked Out List */}
            {getAdminCheckedOut().length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Currently Checked Out</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAdminCheckedOut().map((deviceName) => (
                    <div key={deviceName} className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{deviceName}</h4>
                          <p className="text-xs text-gray-600">Checked out by you</p>
                        </div>
                        <button
                          onClick={() => handleAdminReturn(deviceName)}
                          disabled={isLoading}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transform transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Return
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Checkout Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Available Devices to Checkout</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">{availableDevices.length} devices available</span>
                </div>
              </div>
              {availableDevices.length === 0 ? (
                <p className="text-gray-600">No devices available to checkout or you&apos;ve reached your limit.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {availableDevicesToDisplay.map((device) => (
                      <div key={device.name} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{device.name}</h4>
                            <p className="text-xs text-gray-600">{device.units} units available</p>
                          </div>
                          <button
                            onClick={() => handleAdminCheckout(device.name)}
                            disabled={isLoading || getAdminCheckedOut().length >= 2}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transform transition-all duration-200 hover:scale-105"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Checkout
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {availableDevicesTotalPages > 1 && (
                    <Pagination
                      currentPage={availableDevicesCurrentPage}
                      totalPages={availableDevicesTotalPages}
                      onPageChange={handleAvailableDevicesPageChange}
                      disabled={isLoading}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Add Device Section */}
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Inventory</h2>
                <p className="text-gray-600 mt-1">Add new devices to the DevLab collection</p>
              </div>
              <button
                onClick={() => setShowAddDevice(!showAddDevice)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {showAddDevice ? 'Cancel' : 'Add Device'}
              </button>
            </div>

            {showAddDevice && (
              <form onSubmit={handleAddDevice} className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Device Name</label>
                    <input
                      type="text"
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g. iPhone 15 Pro"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Number of Units</label>
                    <input
                      type="number"
                      min="1"
                      value={newDeviceUnits}
                      onChange={(e) => setNewDeviceUnits(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Add Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddDevice(false)}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Device Inventory */}
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Device Inventory</h2>
                <p className="text-gray-600 mt-1">Monitor and manage your DevLab collection</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">{books.length} devices in inventory</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-600 font-medium">Loading inventory...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No devices in inventory</h3>
                <p className="text-gray-600">Add some devices to get started with your DevLab management.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Device Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Units Available
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devicesToDisplay.map((device: Device) => (
                      <tr key={device.name} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {device.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {device.units}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                            device.units === 0 ? 'bg-red-100 text-red-800' :
                            device.units === 1 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {device.units === 0 ? 'Out of Stock' :
                             device.units === 1 ? 'Low Stock' :
                             'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  currentPage={devicesCurrentPage}
                  totalPages={devicesTotalPages}
                  onPageChange={handleDevicesPageChange}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* User Activity */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">User Activity</h2>
                <p className="text-gray-600 mt-1">Track checkout activity and user engagement</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">{users.length} registered users</span>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No registered users</h3>
                <p className="text-gray-600">Users will appear here once they start using the DevLab.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Account Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Checked Out
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersToDisplay.map((u: User) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-bold text-white">{u.name.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          User
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm font-medium text-gray-900">{u.checkedOutDevices.length} devices</span>
                            {u.checkedOutDevices.length > 0 && (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {u.checkedOutDevices.map((deviceName, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                    title={deviceName}
                                  >
                                    {deviceName.length > 15 ? `${deviceName.substring(0, 15)}...` : deviceName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                            u.checkedOutDevices.length >= 2 ? 'bg-red-100 text-red-800' :
                            u.checkedOutDevices.length === 1 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {u.checkedOutDevices.length >= 2 ? 'At Limit' :
                             u.checkedOutDevices.length === 1 ? 'Active' :
                             'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  currentPage={usersCurrentPage}
                  totalPages={usersTotalPages}
                  onPageChange={handleUsersPageChange}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
