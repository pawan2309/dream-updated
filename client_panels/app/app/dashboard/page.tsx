'use client'

import Header from '../../../components/Header'
import DashboardGrid from '../../../components/DashboardGrid'
import Footer from '../../../components/Footer'
import ProtectedRoute from '../../../components/ProtectedRoute'

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-white relative pt-[90px]">
        <Header />
        <div className="flex-1 p-2">
          <DashboardGrid />
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  )
} 