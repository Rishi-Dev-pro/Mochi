import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    { path: '/', label: 'Home', icon: '🌾' },
    { path: '/chat', label: 'Chat', icon: '📖' },
    { path: '/emotion-history', label: 'History', icon: '🗺️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <nav className="minecraft-navbar">
      <div className="mc-nav-container">
        
        {/* Logo */}
        <Link to="/" className="mc-nav-logo">
          <span className="logo-icon float-effect">🌸</span>
          <span className="logo-text pixel-font">MOCHI</span>
        </Link>

        {/* 3D Minecraft Hotbar Nav Slots */}
        <div className="mc-hotbar-hud">
          {navItems.map((item) => {
            const isActive = currentPath === item.path
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`mc-hotbar-slot ${isActive ? 'active-slot' : ''}`}
              >
                <span className="slot-icon">{item.icon}</span>
                <span className="slot-label">{item.label}</span>
                {isActive && <div className="active-glow-indicator" />}
              </Link>
            )
          })}
        </div>

      </div>
    </nav>
  )
}
