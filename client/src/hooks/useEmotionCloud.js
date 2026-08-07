import { useEffect, useState } from 'react'
import { useEmotionStore } from '../store/useEmotionStore'
import {
  uploadEmotionToCloud,
  syncQueuedEmotions,
  isOnline,
  onNetworkChange,
  getQueuedEmotionsCount
} from '../services/emotionCloudService'

export function useEmotionCloud() {
  const emotionStore = useEmotionStore()
  const [isCloudOnline, setIsCloudOnline] = useState(isOnline())
  const [queuedCount, setQueuedCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Upload emotion to cloud when currentEmotion changes
  useEffect(() => {
    const uploadToCloud = async () => {
      const emotion = emotionStore.currentEmotion
      if (!emotion) return

      const result = await uploadEmotionToCloud(emotion)
      
      if (!result.success && result.queued) {
        setQueuedCount(getQueuedEmotionsCount())
      }
    }

    uploadToCloud()
  }, [emotionStore.currentEmotion])

  // Monitor network status
  useEffect(() => {
    const unsubscribe = onNetworkChange((online) => {
      setIsCloudOnline(online)
      
      // Sync when connection restored
      if (online) {
        syncWhenOnline()
      }
    })

    return unsubscribe
  }, [])

  // Sync queued emotions when online
  const syncWhenOnline = async () => {
    if (!isCloudOnline) return

    setIsSyncing(true)
    const result = await syncQueuedEmotions()
    
    if (result.success) {
      setQueuedCount(0)
    }
    setIsSyncing(false)
  }

  return {
    isCloudOnline,
    queuedCount,
    isSyncing,
    syncNow: syncWhenOnline
  }
}
