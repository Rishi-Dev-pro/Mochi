import { useEmotionStore as zustandStore } from './emotionStore'

// Custom hook to use emotion store
export function useEmotionStore() {
  return zustandStore()
}

// Selector hooks for performance optimization
export function useCurrentEmotion() {
  return zustandStore((state) => state.currentEmotion)
}

export function useEmotionHistory() {
  return zustandStore((state) => state.emotionHistory)
}

export function useEmotionActions() {
  return zustandStore((state) => ({
    setEmotion: state.setEmotion,
    setIntensity: state.setIntensity,
    reactToGesture: state.reactToGesture,
    reactToMessage: state.reactToMessage,
    setIdle: state.setIdle,
    reset: state.reset
  }))
}

export function useEmotionEmoji() {
  return zustandStore((state) => state.getEmotionEmoji())
}

export function useEmotionColor() {
  return zustandStore((state) => state.getEmotionColor())
}
