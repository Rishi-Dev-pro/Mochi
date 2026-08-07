import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WebcamProvider } from './context/WebcamContext'
import { CloudSyncProvider } from './context/CloudSyncContext'
import CloudSyncIndicator from './components/CloudSyncIndicator'
import Navbar from './components/Navbar'
import EmotionDisplay from './components/EmotionDisplay'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import EmotionHistoryPage from './pages/EmotionHistoryPage'
import { useEmotionHistory } from './hooks/useEmotionHistory'
import './App.css'

function EmotionTracker() {
  useEmotionHistory()
  return null
}

export default function App() {
  return (
    <Router>
      <WebcamProvider>
        <CloudSyncProvider>
          <EmotionTracker />
          <Navbar />
          <EmotionDisplay />
          <CloudSyncIndicator />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/emotion-history" element={<EmotionHistoryPage />} />
            </Routes>
          </main>
        </CloudSyncProvider>
      </WebcamProvider>
    </Router>
  )
}
