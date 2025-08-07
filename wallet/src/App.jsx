import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Credentials from './pages/Credentials'
import CredentialDetail from './pages/CredentialDetail'
import AccessRequests from './pages/AccessRequests'
import Settings from './pages/Settings'
import Login from './pages/Login'
import QRScanner from './pages/QRScanner'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your wallet...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/credentials/:credentialId" element={<CredentialDetail />} />
        <Route path="/access-requests" element={<AccessRequests />} />
        <Route path="/qr-scanner" element={<QRScanner />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
