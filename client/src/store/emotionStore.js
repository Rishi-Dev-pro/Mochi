import { create } from 'zustand'

// Emotion types
export const EMOTION_TYPES = {
  HAPPY: 'happy',
  CURIOUS: 'curious',
  CONCERNED: 'concerned',
  SLEEPY: 'sleepy',
  EXCITED: 'excited',
  NEUTRAL: 'neutral'
}

// Emotion emoji map
export const EMOTION_EMOJIS = {
  happy: '😊',
  curious: '🤔',
  concerned: '😟',
  sleepy: '😴',
  excited: '🎉',
  neutral: '😐'
}

// Create Zustand store
export const useEmotionStore = create((set, get) => ({
  // State
  currentEmotion: {
    type: EMOTION_TYPES.NEUTRAL,
    intensity: 50, // 0-100
    context: 'Initial greeting',
    timestamp: Date.now(),
    triggeredBy: null // 'gesture', 'message', 'timeout', null
  },

  // Emotion history (last 20 emotions)
  emotionHistory: [],

  // Actions
  setEmotion: (type, intensity = 50, context = '', triggeredBy = null) => {
    const newEmotion = {
      type,
      intensity: Math.max(0, Math.min(100, intensity)), // Clamp 0-100
      context,
      timestamp: Date.now(),
      triggeredBy
    }

    set((state) => {
      const updatedHistory = [newEmotion, ...state.emotionHistory].slice(0, 20)
      return {
        currentEmotion: newEmotion,
        emotionHistory: updatedHistory
      }
    })
  },

  // Update only intensity
  setIntensity: (intensity) => {
    set((state) => ({
      currentEmotion: {
        ...state.currentEmotion,
        intensity: Math.max(0, Math.min(100, intensity)),
        timestamp: Date.now()
      }
    }))
  },

  // React to gesture (secondary emotion trigger)
  reactToGesture: (gesture) => {
    // Gestures enhance but don't override facial emotion
    const reactions = {
      wave: { intensity: 10 }, // +10 to current intensity
      nod: { intensity: 5 },
      point: { intensity: 15 }
    }

    const reaction = reactions[gesture.gesture]
    if (reaction) {
      const currentIntensity = get().currentEmotion.intensity
      const newIntensity = Math.min(100, currentIntensity + reaction.intensity)
      get().setIntensity(newIntensity)
    }
  },

  // React to chat message
  reactToMessage: (message) => {
    // Simple sentiment detection
    const positive = /good|great|awesome|amazing|love|happy|yes/i.test(message)
    const negative = /bad|hate|sad|angry|no/i.test(message)
    const question = /\?/.test(message)

    if (positive) {
      get().setEmotion(
        EMOTION_TYPES.HAPPY,
        80,
        `Positive message: "${message.slice(0, 30)}..."`,
        'message'
      )
    } else if (negative) {
      get().setEmotion(
        EMOTION_TYPES.CONCERNED,
        70,
        `Negative message: "${message.slice(0, 30)}..."`,
        'message'
      )
    } else if (question) {
      get().setEmotion(
        EMOTION_TYPES.CURIOUS,
        75,
        `Question asked: "${message.slice(0, 30)}..."`,
        'message'
      )
    }
  },

  // Idle timeout (set neutral after inactivity)
  setIdle: () => {
    get().setEmotion(
      EMOTION_TYPES.NEUTRAL,
      50,
      'No recent interactions',
      'timeout'
    )
  },

  // Get emotion emoji
  getEmotionEmoji: () => {
    return EMOTION_EMOJIS[get().currentEmotion.type] || '😐'
  },

  // Get emotion color (for UI)
  getEmotionColor: () => {
    const colors = {
      happy: '#fbbf24', // amber
      curious: '#60a5fa', // blue
      concerned: '#f87171', // red
      sleepy: '#a78bfa', // purple
      excited: '#34d399', // emerald
      neutral: '#9ca3af' // gray
    }
    return colors[get().currentEmotion.type] || '#9ca3af'
  },

  // Reset to neutral
  reset: () => {
    get().setEmotion(EMOTION_TYPES.NEUTRAL, 50, 'Reset')
  }
}))
