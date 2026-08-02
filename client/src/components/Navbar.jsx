import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">🌙 Mochi</Link>
        <ul className="nav-menu">
          <li><Link to="/" className="nav-link">Home</Link></li>
          <li><Link to="/chat" className="nav-link">Chat</Link></li>
          <li><Link to="/emotion-history" className="nav-link">📊 History</Link></li>
          <li><Link to="/settings" className="nav-link">Settings</Link></li>
        </ul>
      </div>
    </nav>
  )
}
