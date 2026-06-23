import { Routes, Route, Navigate } from 'react-router-dom'
import { TripProvider } from '@/context/TripContext'
import { getSession } from '@/lib/storage'
import JoinPage from '@/pages/JoinPage'
import HomePage from '@/pages/HomePage'
import SchedulePage from '@/pages/SchedulePage'
import EventPage from '@/pages/EventPage'
import FeedPage from '@/pages/FeedPage'
import PackingPage from '@/pages/PackingPage'
import ExpensesPage from '@/pages/ExpensesPage'
import SettingsPage from '@/pages/SettingsPage'
import AppLayout from '@/components/layout/AppLayout'
import SwirlBackground from '@/components/layout/SwirlBackground'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = getSession()
  if (!session) return <Navigate to="/join" replace />
  return <TripProvider>{children}</TripProvider>
}

export default function App() {
  return (
    <>
      <SwirlBackground />
      <Routes>
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/event/:id" element={<EventPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/updates" element={<Navigate to="/feed" replace />} />
                  <Route path="/packing" element={<PackingPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
