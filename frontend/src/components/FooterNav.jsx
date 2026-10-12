import { NavLink } from 'react-router-dom'
import { FaCompass, FaUsers, FaMasksTheater, FaGear } from 'react-icons/fa6'

const items = [
  { to: '/explore', label: 'Explore', Icon: FaCompass },
  { to: '/twins', label: 'Your Twins', Icon: FaMasksTheater },
  { to: '/groups', label: 'Group Chats', Icon: FaUsers },
  { to: '/settings', label: 'Settings', Icon: FaGear },
]

function FooterNav({ items: navItems = items, ariaLabel = 'User navigation', className = 'dashboard-footer' }) {
  return (
    <footer className={className}>
      <nav aria-label={ariaLabel}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'dashboard-nav-link active' : 'dashboard-nav-link'}>
            <Icon aria-hidden="true" /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </footer>
  )
}

export default FooterNav
