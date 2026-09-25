import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from '../features/dashboard/Dashboard'
import { Tasks } from '../features/tasks/Tasks'
import { BlockList } from '../features/blocklist/BlockList'
import { Stats } from '../features/stats/Stats'
import { Settings } from '../features/settings/Settings'
import { Login, AuthGuard, useAuthInit } from '../features/auth'
import { PetWindow } from '../features/pet/PetWindow'
import { FocusSessionView } from '../features/focus/FocusSessionView'
import { useAuthStore } from '../features/auth/authStore'

export default function App() {
  useAuthInit() // Initialize auth state once
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <Routes>
      <Route path="/pet-window" element={<PetWindow />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      
      {/* Protected Routes */}
      <Route element={<AuthGuard><Layout /></AuthGuard>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/blocklist" element={<BlockList />} />
        <Route path="/focus" element={<FocusSessionView />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
