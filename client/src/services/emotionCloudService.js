import { supabase, getUserId, isOnline, onNetworkChange } from './supabaseClient'

export { isOnline, onNetworkChange }

const SYNC_QUEUE_KEY = 'mochi_sync_queue'

// Upload emotion to Supabase
export async function uploadEmotionToCloud(emotion) {
  if (!emotion || !emotion.type) {
    return { success: false, error: 'Invalid emotion object' }
  }

  if (!isOnline()) {
    // Queue for later sync
    queueForSync(emotion)
    return { success: false, queued: true }
  }

  try {
    const userId = getUserId()
    
    const { data, error } = await supabase
      .from('emotions')
      .insert([
        {
          user_id: userId,
          emotion_type: emotion.type,
          intensity: emotion.intensity ?? 50,
          context: emotion.context || '',
          triggered_by: emotion.triggeredBy || 'detection',
          timestamp: emotion.timestamp || Date.now(),
          date: emotion.date || new Date().toLocaleDateString()
        }
      ])

    if (error) {
      console.error('Upload error:', error)
      queueForSync(emotion)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Catch error:', error)
    queueForSync(emotion)
    return { success: false, error: error.message }
  }
}

// Batch upload multiple emotions
export async function batchUploadEmotions(emotions) {
  if (!emotions || emotions.length === 0) {
    return { success: true, count: 0 }
  }

  if (!isOnline()) {
    emotions.forEach(emotion => queueForSync(emotion))
    return { success: false, queued: emotions.length }
  }

  try {
    const userId = getUserId()
    
    const emotionRecords = emotions.map(emotion => ({
      user_id: userId,
      emotion_type: emotion.type,
      intensity: emotion.intensity ?? 50,
      context: emotion.context || '',
      triggered_by: emotion.triggeredBy || 'detection',
      timestamp: emotion.timestamp || Date.now(),
      date: emotion.date || new Date().toLocaleDateString()
    }))

    const { data, error } = await supabase
      .from('emotions')
      .insert(emotionRecords)

    if (error) {
      console.error('Batch upload error:', error)
      emotions.forEach(emotion => queueForSync(emotion))
      return { success: false, error: error.message }
    }

    return { success: true, count: emotions.length }
  } catch (error) {
    console.error('Batch catch error:', error)
    emotions.forEach(emotion => queueForSync(emotion))
    return { success: false, error: error.message }
  }
}

// Queue emotion for later sync
function queueForSync(emotion) {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
  queue.push({
    ...emotion,
    queuedAt: Date.now()
  })
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

// Sync queued emotions when back online
export async function syncQueuedEmotions() {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
  
  if (queue.length === 0) return { success: true, synced: 0 }

  console.log(`Syncing ${queue.length} queued emotions...`)

  const result = await batchUploadEmotions(queue)

  if (result.success) {
    localStorage.removeItem(SYNC_QUEUE_KEY)
    console.log(`Successfully synced ${queue.length} emotions`)
    return { success: true, synced: queue.length }
  }

  return { success: false, queued: queue.length }
}

// Get emotions from cloud
export async function getCloudEmotions(limit = 100) {
  if (!isOnline()) {
    return { success: false, offline: true }
  }

  try {
    const userId = getUserId()
    
    const { data, error } = await supabase
      .from('emotions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Fetch error:', error)
      return { success: false, error: error.message }
    }

    // Map database field names to client model format
    const formattedData = data.map(item => ({
      id: item.id,
      type: item.emotion_type,
      intensity: item.intensity,
      context: item.context,
      triggeredBy: item.triggered_by,
      timestamp: Number(item.timestamp),
      date: item.date
    }))

    return { success: true, data: formattedData }
  } catch (error) {
    console.error('Fetch catch error:', error)
    return { success: false, error: error.message }
  }
}

// Get cloud emotions by date range
export async function getCloudEmotionsByRange(startDate, endDate) {
  if (!isOnline()) {
    return { success: false, offline: true }
  }

  try {
    const userId = getUserId()
    
    const { data, error } = await supabase
      .from('emotions')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.getTime())
      .lte('timestamp', endDate.getTime())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Date range fetch error:', error)
      return { success: false, error: error.message }
    }

    const formattedData = data.map(item => ({
      id: item.id,
      type: item.emotion_type,
      intensity: item.intensity,
      context: item.context,
      triggeredBy: item.triggered_by,
      timestamp: Number(item.timestamp),
      date: item.date
    }))

    return { success: true, data: formattedData }
  } catch (error) {
    console.error('Date range catch error:', error)
    return { success: false, error: error.message }
  }
}

// Get cloud statistics
export async function getCloudStats(days = 30) {
  if (!isOnline()) {
    return { success: false, offline: true }
  }

  try {
    const userId = getUserId()
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('emotions')
      .select('emotion_type, intensity')
      .eq('user_id', userId)
      .gte('timestamp', sinceDate.getTime())

    if (error) {
      console.error('Stats fetch error:', error)
      return { success: false, error: error.message }
    }

    // Calculate stats
    const stats = calculateStats(data)
    return { success: true, data: stats, period: `Last ${days} days` }
  } catch (error) {
    console.error('Stats catch error:', error)
    return { success: false, error: error.message }
  }
}

// Calculate statistics from emotions array
function calculateStats(emotions) {
  if (!emotions || emotions.length === 0) {
    return {
      totalEmotions: 0,
      averageIntensity: 0,
      mostCommonEmotion: 'neutral',
      emotionDistribution: {}
    }
  }

  const emotionCounts = {
    happy: 0,
    concerned: 0,
    angry: 0,
    excited: 0,
    neutral: 0
  }
  let totalIntensity = 0

  emotions.forEach(emotion => {
    const type = emotion.emotion_type || emotion.type || 'neutral'
    emotionCounts[type] = (emotionCounts[type] || 0) + 1
    totalIntensity += (emotion.intensity || 0)
  })

  let mostCommonEmotion = 'neutral'
  let maxCount = -1

  Object.entries(emotionCounts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count
      mostCommonEmotion = type
    }
  })

  return {
    totalEmotions: emotions.length,
    averageIntensity: Math.round(totalIntensity / emotions.length),
    mostCommonEmotion,
    emotionDistribution: emotionCounts
  }
}

// Get queued emotions count
export function getQueuedEmotionsCount() {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]')
  return queue.length
}

// Subscribe to real-time emotion updates
export function subscribeToEmotionUpdates(callback) {
  const userId = getUserId()

  const channel = supabase
    .channel('emotions-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'emotions',
        filter: `user_id=eq.${userId}`
      },
      payload => {
        callback(payload)
      }
    )
    .subscribe()

  return channel
}
