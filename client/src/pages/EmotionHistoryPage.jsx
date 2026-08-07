import { useState, useEffect } from 'react'
import {
  getEmotionHistory,
  getTodaysEmotions,
  calculateEmotionStats,
  getEmotionDistribution,
  exportEmotionHistory,
  clearEmotionHistory
} from '../services/emotionHistoryService'
import { useCloudSync } from '../context/CloudSyncContext'
import { getCloudStats, getCloudEmotions } from '../services/emotionCloudService'
import '../styles/minecraft-theme.css'
import '../styles/minecraft-blocks.css'
import '../styles/minecraft-buttons.css'
import '../styles/minecraft-effects.css'
import '../styles/emotion-history.css'

const EMOTION_EMOJIS = {
  happy: '🌸',
  curious: '🤔',
  concerned: '💜',
  sleepy: '😴',
  excited: '✨',
  neutral: '🍃',
  angry: '🔥'
}

const EMOTION_COLORS = {
  happy: '#ffdf7d',
  curious: '#7ee8fa',
  concerned: '#c084fc',
  sleepy: '#a78bfa',
  excited: '#ff85a2',
  neutral: '#88b04b',
  angry: '#ff7675'
}

export default function EmotionHistoryPage() {
  const { isCloudOnline } = useCloudSync()
  const [useCloud, setUseCloud] = useState(true)

  const [localHistory, setLocalHistory] = useState([])
  const [cloudHistory, setCloudHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [todaysEmotions, setTodaysEmotions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [useCloud, isCloudOnline])

  const loadData = async () => {
    const allLocal = getEmotionHistory()
    setLocalHistory(allLocal)

    if (useCloud && isCloudOnline) {
      const cloudRes = await getCloudEmotions(200)
      if (cloudRes.success) {
        setCloudHistory(cloudRes.data)
        const cloudStatsRes = await getCloudStats(30)
        if (cloudStatsRes.success) {
          setStats(cloudStatsRes.data)
        } else {
          setStats(calculateEmotionStats(cloudRes.data))
        }
      } else {
        setStats(calculateEmotionStats(allLocal))
      }
    } else {
      setStats(calculateEmotionStats(allLocal))
    }

    setTodaysEmotions(getTodaysEmotions())
    setLoading(false)
  }

  const handleExport = () => {
    exportEmotionHistory()
  }

  const handleClear = () => {
    if (window.confirm('Are you sure? This will delete all local emotion history.')) {
      clearEmotionHistory()
      loadData()
    }
  }

  const activeHistory = (useCloud && isCloudOnline && cloudHistory.length > 0) ? cloudHistory : localHistory

  const getFilteredHistory = () => {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000

    switch (filter) {
      case 'today':
        const todayStr = new Date().toLocaleDateString()
        return activeHistory.filter(e => e.date === todayStr || (now - e.timestamp < day))
      case 'week':
        return activeHistory.filter(e => now - e.timestamp < 7 * day)
      case 'month':
        return activeHistory.filter(e => now - e.timestamp < 30 * day)
      default:
        return activeHistory
    }
  }

  if (loading && !stats) {
    return (
      <div className="minecraft-sky" style={{ padding: '40px', textAlign: 'center', color: '#ffffff' }}>
        <p className="pixel-font">Loading emotion history logs...</p>
      </div>
    )
  }

  const filteredHistory = getFilteredHistory()
  const distribution = getEmotionDistribution(filteredHistory)

  return (
    <div className="minecraft-sky" style={{ padding: '24px 20px 60px 20px', minHeight: 'calc(100vh - 70px)' }}>
      <div className="emotion-history-page">
        
        {/* Header */}
        <header className="mc-3d-block grass-block block-appear" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="pixel-font" style={{ fontSize: '0.8rem', color: 'var(--mc-sakura-light)', marginBottom: '6px' }}>
            📜 EXPLORER MAP LOGS
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: '4px 0' }}>Emotion History & Analytics</h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
            Review past mood entries, trends, and cloud data synchronization.
          </p>
        </header>

        {/* Data Source Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            className={`filter-btn ${useCloud ? 'active' : ''}`}
            onClick={() => setUseCloud(true)}
            disabled={!isCloudOnline}
            style={{ opacity: !isCloudOnline ? 0.5 : 1 }}
          >
            ☁️ Cloud Data {!isCloudOnline && '(Offline)'}
          </button>
          <button
            className={`filter-btn ${!useCloud ? 'active' : ''}`}
            onClick={() => setUseCloud(false)}
          >
            📱 Local Data
          </button>
        </div>

        {/* Statistics Grid */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Total Tracked</p>
              <p className="stat-value">{stats.totalEmotions}</p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Avg Intensity</p>
              <p className="stat-value">{stats.averageIntensity}%</p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Most Common</p>
              <p className="stat-value">
                {EMOTION_EMOJIS[stats.mostCommonEmotion] || '🍃'} {stats.mostCommonEmotion}
              </p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Today's Count</p>
              <p className="stat-value">{todaysEmotions.length}</p>
            </div>
          </div>
        )}

        {/* Distribution Section */}
        <div className="distribution-section">
          <h2>Emotion Distribution</h2>
          <div className="distribution-grid">
            {distribution.map(dist => (
              <div key={dist.name} className="distribution-item">
                <div className="distribution-header">
                  <span>{EMOTION_EMOJIS[dist.name] || '🍃'}</span>
                  <span className="emotion-name">{dist.name}</span>
                </div>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{
                      width: `${dist.percentage}%`,
                      backgroundColor: EMOTION_COLORS[dist.name] || '#88b04b'
                    }}
                  />
                </div>
                <p className="distribution-text">{dist.value} ({dist.percentage}%)</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="filter-controls">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Time
          </button>
          <button
            className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button
            className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
            onClick={() => setFilter('month')}
          >
            This Month
          </button>
        </div>

        {/* Timeline Section */}
        <div className="timeline-section">
          <div className="timeline">
            <h2>Emotion Timeline ({filteredHistory.length} total)</h2>
            {filteredHistory.length === 0 ? (
              <p className="empty-state">No emotions recorded for this period</p>
            ) : (
              [...filteredHistory].reverse().map((emotion, idx) => (
                <div key={emotion.id || idx} className="timeline-item" style={{ borderLeftColor: EMOTION_COLORS[emotion.type] || '#88b04b' }}>
                  <div className="timeline-emoji">
                    {EMOTION_EMOJIS[emotion.type] || '🍃'}
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-emotion">
                      {emotion.type}{' '}
                      <span className="timeline-intensity">
                        ({emotion.intensity}% XP)
                      </span>
                    </p>
                    {emotion.context && (
                      <p className="timeline-context">{emotion.context}</p>
                    )}
                    <p className="timeline-time">
                      {new Date(emotion.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn-primary btn-lg" onClick={handleExport}>
            📥 Export History Log
          </button>
          <button className="btn-danger btn-lg" onClick={handleClear}>
            🗑️ Clear Local History
          </button>
        </div>
      </div>
    </div>
  )
}
