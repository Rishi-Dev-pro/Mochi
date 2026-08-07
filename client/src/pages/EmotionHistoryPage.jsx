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
import '../styles/emotion-history.css'

const EMOTION_EMOJIS = {
  happy: '😊',
  curious: '🤔',
  concerned: '😟',
  sleepy: '😴',
  excited: '🎉',
  neutral: '😐',
  angry: '😠'
}

const EMOTION_COLORS = {
  happy: '#fbbf24',
  curious: '#60a5fa',
  concerned: '#f87171',
  sleepy: '#a78bfa',
  excited: '#34d399',
  neutral: '#9ca3af',
  angry: '#ef4444'
}

export default function EmotionHistoryPage() {
  const { isCloudOnline } = useCloudSync()
  const [useCloud, setUseCloud] = useState(true)

  const [localHistory, setLocalHistory] = useState([])
  const [cloudHistory, setCloudHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [todaysEmotions, setTodaysEmotions] = useState([])
  const [filter, setFilter] = useState('all') // all, today, week, month
  const [loading, setLoading] = useState(true)

  // Load history on mount or toggle change
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Refresh every 5s
    return () => clearInterval(interval)
  }, [useCloud, isCloudOnline])

  const loadData = async () => {
    // Always fetch local history first as baseline/fallback
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
        // Fallback to local if cloud fetch fails
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
    return <div className="page">Loading emotion history...</div>
  }

  const filteredHistory = getFilteredHistory()
  const distribution = getEmotionDistribution(filteredHistory)

  return (
    <div className="page emotion-history-page">
      <h1>Emotion History & Analytics</h1>

      {/* Cloud/Local Data Toggle */}
      <div className="data-source-toggle" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
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

      {/* Statistics Overview */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Emotions Tracked</p>
            <p className="stat-value">{stats.totalEmotions}</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Average Intensity</p>
            <p className="stat-value">{stats.averageIntensity}%</p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Most Common</p>
            <p className="stat-value">
              {EMOTION_EMOJIS[stats.mostCommonEmotion] || '😐'} {stats.mostCommonEmotion}
            </p>
          </div>

          <div className="stat-card">
            <p className="stat-label">Today's Count</p>
            <p className="stat-value">{todaysEmotions.length}</p>
          </div>
        </div>
      )}

      {/* Emotion Distribution */}
      <div className="distribution-section">
        <h2>Emotion Distribution</h2>
        <div className="distribution-grid">
          {distribution.map(dist => (
            <div key={dist.name} className="distribution-item">
              <div className="distribution-header">
                <span>{EMOTION_EMOJIS[dist.name] || '😐'}</span>
                <span className="emotion-name">{dist.name}</span>
              </div>
              <div className="distribution-bar">
                <div
                  className="distribution-fill"
                  style={{
                    width: `${dist.percentage}%`,
                    backgroundColor: EMOTION_COLORS[dist.name] || '#9ca3af'
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

      {/* Emotion Timeline */}
      <div className="timeline-section">
        <h2>Emotion Timeline ({filteredHistory.length} total)</h2>
        <div className="timeline">
          {filteredHistory.length === 0 ? (
            <p className="empty-state">No emotions recorded for this period</p>
          ) : (
            [...filteredHistory].reverse().map((emotion, idx) => (
              <div key={emotion.id || idx} className="timeline-item">
                <div className="timeline-emoji">
                  {EMOTION_EMOJIS[emotion.type] || '😐'}
                </div>
                <div className="timeline-content">
                  <p className="timeline-emotion">
                    {emotion.type}{' '}
                    <span className="timeline-intensity">
                      ({emotion.intensity}%)
                    </span>
                  </p>
                  {emotion.context && (
                    <p className="timeline-context">{emotion.context}</p>
                  )}
                  <p className="timeline-time">
                    {new Date(emotion.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div
                  className="timeline-bar"
                  style={{
                    backgroundColor: EMOTION_COLORS[emotion.type] || '#9ca3af',
                    height: `${emotion.intensity}%`
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-primary" onClick={handleExport}>
          📥 Export History
        </button>
        <button className="btn-danger" onClick={handleClear}>
          🗑️ Clear Local History
        </button>
      </div>
    </div>
  )
}
