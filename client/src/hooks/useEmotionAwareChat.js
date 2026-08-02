import { useRef, useEffect } from 'react'
import { useEmotionStore } from '../store/useEmotionStore'
import { buildEmotionContext, hasEmotionChanged } from '../services/emotionAwareChatService'

export function useEmotionAwareChat() {
  const emotionStore = useEmotionStore()
  const previousEmotionRef = useRef(null)

  // Get current emotion context
  const getEmotionContext = () => {
    const currentEmotion = emotionStore.currentEmotion
    return buildEmotionContext(currentEmotion)
  }

  // Track emotion changes for chat awareness
  useEffect(() => {
    const currentEmotion = emotionStore.currentEmotion

    if (hasEmotionChanged(previousEmotionRef.current, currentEmotion)) {
      previousEmotionRef.current = currentEmotion
    }
  }, [emotionStore.currentEmotion])

  return {
    currentEmotion: emotionStore.currentEmotion,
    getEmotionContext,
    emotionIntensity: emotionStore.currentEmotion?.intensity || 50,
    emotionType: emotionStore.currentEmotion?.type || 'neutral'
  }
}
