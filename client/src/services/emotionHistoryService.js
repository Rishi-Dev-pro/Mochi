// ============ EMOTION HISTORY SERVICE ============

const STORAGE_KEY = 'mochi_emotion_history'
const MAX_HISTORY_SIZE = 1000 // Store last 1000 emotions

// Initialize emotion history
export function initializeEmotionHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading emotion history:', error)
    return []
  }
}

// Add emotion to history
export function addEmotionToHistory(emotion) {
  if (!emotion || !emotion.type) return null

  const history = initializeEmotionHistory()

  const emotionEntry = {
    type: emotion.type,
    intensity: emotion.intensity ?? 50,
    context: emotion.context || '',
    triggeredBy: emotion.triggeredBy || 'detection',
    timestamp: Date.now(),
    date: new Date().toLocaleDateString()
  }

  history.push(emotionEntry)

  // Keep only last MAX_HISTORY_SIZE entries
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift()
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Error saving emotion history:', error)
  }

  return emotionEntry
}

// Get emotion history
export function getEmotionHistory() {
  return initializeEmotionHistory()
}

// Get today's emotions
export function getTodaysEmotions() {
  const history = getEmotionHistory()
  const today = new Date().toLocaleDateString()
  return history.filter(emotion => emotion.date === today)
}

// Get emotions by date range
export function getEmotionsByDateRange(startDate, endDate) {
  const history = getEmotionHistory()
  return history.filter(emotion => {
    const emotionDate = new Date(emotion.timestamp)
    return emotionDate >= startDate && emotionDate <= endDate
  })
}

// Calculate emotion statistics
export function calculateEmotionStats(emotions = null) {
  const data = emotions || getEmotionHistory()

  if (data.length === 0) {
    return {
      totalEmotions: 0,
      averageIntensity: 0,
      mostCommonEmotion: 'neutral',
      emotionCounts: {
        happy: 0,
        concerned: 0,
        angry: 0,
        excited: 0,
        neutral: 0
      }
    }
  }

  // Count emotions
  const emotionCounts = {
    happy: 0,
    concerned: 0,
    angry: 0,
    excited: 0,
    neutral: 0
  }
  let totalIntensity = 0

  data.forEach(emotion => {
    const type = emotion.type || 'neutral'
    emotionCounts[type] = (emotionCounts[type] || 0) + 1
    totalIntensity += (emotion.intensity || 0)
  })

  // Find most common
  let mostCommonEmotion = 'neutral'
  let maxCount = -1

  Object.entries(emotionCounts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count
      mostCommonEmotion = type
    }
  })

  return {
    totalEmotions: data.length,
    averageIntensity: Math.round(totalIntensity / data.length),
    mostCommonEmotion: mostCommonEmotion,
    emotionCounts: emotionCounts
  }
}

// Get emotion trend (last N emotions)
export function getEmotionTrend(limit = 10) {
  const history = getEmotionHistory()
  return history.slice(-limit).map(emotion => ({
    type: emotion.type,
    intensity: emotion.intensity,
    timestamp: emotion.timestamp
  }))
}

// Clear emotion history
export function clearEmotionHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing emotion history:', error)
  }
}

// Export history as JSON
export function exportEmotionHistory() {
  const history = getEmotionHistory()
  const dataStr = JSON.stringify(history, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = `mochi-emotion-history-${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(url)
}

// Get emotion distribution (pie chart data)
export function getEmotionDistribution(emotions = null) {
  const stats = calculateEmotionStats(emotions)
  const total = stats.totalEmotions || 1

  return Object.entries(stats.emotionCounts).map(([emotion, count]) => ({
    name: emotion,
    value: count,
    percentage: stats.totalEmotions === 0 ? 0 : Math.round((count / total) * 100)
  }))
}
