import { useEffect, useRef } from 'react'
import { useEmotionStore } from '../store/useEmotionStore'
import { addEmotionToHistory } from '../services/emotionHistoryService'

export function useEmotionHistory() {
  const emotionStore = useEmotionStore()
  const lastRecordedEmotionRef = useRef(null)

  // Auto-record emotion changes to history
  useEffect(() => {
    const currentEmotion = emotionStore.currentEmotion
    if (!currentEmotion || !currentEmotion.type) return

    // Only record if emotion type or intensity changed significantly
    if (
      !lastRecordedEmotionRef.current ||
      lastRecordedEmotionRef.current.type !== currentEmotion.type ||
      Math.abs(lastRecordedEmotionRef.current.intensity - currentEmotion.intensity) > 10
    ) {
      addEmotionToHistory(currentEmotion)
      lastRecordedEmotionRef.current = currentEmotion
    }
  }, [emotionStore.currentEmotion])

  return {
    currentEmotion: emotionStore.currentEmotion
  }
}
