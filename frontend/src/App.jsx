import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import { useAuth } from './context/useAuth'
import LandingPage from './pages/Landing/LandingPage'
import AuthPage from './pages/Auth/AuthPage'
import RequireAuth from './pages/RequireAuth/RequireAuth'
import DashboardLayout from './pages/DashboardLayout/DashboardLayout'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ExplorePage from './pages/Explore/ExplorePage'
import YourTwinsPage from './pages/YourTwins/YourTwinsPage'
import GroupChatsPage from './pages/GroupChats/GroupChatsPage'
import SettingsPage from './pages/Settings/SettingsPage'
import ChatPage from './pages/Chat/ChatPage'
import NotFound from './pages/NotFound/NotFound'
import RequireAdmin from './pages/RequireAdmin/RequireAdmin'
import AdminPage from './pages/Admin/AdminPage'

function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return <main className="auth-loading">Opening Time Mask…</main>
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<AuthPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/twins" element={<YourTwinsPage />} />
          <Route path="/groups" element={<GroupChatsPage />} />
          <Route path="/groups/:groupId" element={<GroupChatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat/:maskId" element={<ChatPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}

export default App
