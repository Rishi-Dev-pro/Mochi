import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WebcamProvider } from './context/WebcamContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

export default function App() {
  return (
    <Router>
      <WebcamProvider>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </WebcamProvider>
    </Router>
  )
}
