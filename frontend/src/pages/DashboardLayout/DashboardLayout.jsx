import { Link, Outlet } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa6'
import { useAuth } from '../../context/useAuth'
import FooterNav from '../../components/FooterNav'
import '../dashboard.css'

function DashboardLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" to="/dashboard"><span className="brand-mark"><span /></span><span>TIME <i>MASK</i></span></Link>
        <div className="dashboard-user"><span className="dashboard-greeting">{user?.name}</span><button onClick={logout}>Sign out <FaArrowRight /></button></div>
      </header>
      <main className="dashboard-main"><Outlet /></main>
      <FooterNav />
    </div>
  )
}

export default DashboardLayout
