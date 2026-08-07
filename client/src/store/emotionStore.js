import { create } from 'zustand'

// Emotion types
export const EMOTION_TYPES = {
  HAPPY: 'happy',
  ANGRY: 'angry',
  SHOUTING: 'shouting',
  WAVING: 'waving',
  TEASING: 'teasing',
  SAD: 'sad',
  SURPRISED: 'surprised',
  CONFUSED: 'confused',
  SLEEPY: 'sleepy',
  EXCITED: 'excited',
  CURIOUS: 'curious',
  CONCERNED: 'concerned',
  NEUTRAL: 'neutral'
}

// Emotion emoji map
export const EMOTION_EMOJIS = {
  happy: '😊',
  angry: '😠',
  shouting: '📢',
  waving: '👋',
  teasing: '😜',
  sad: '😢',
  surprised: '😲',
  confused: '🤔',
  sleepy: '😴',
  excited: '🎉',
  curious: '🧐',
  concerned: '😟',
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
    const reactions = {
      wave: { type: EMOTION_TYPES.WAVING, intensity: 80 },
      nod: { type: EMOTION_TYPES.HAPPY, intensity: 60 },
      point: { type: EMOTION_TYPES.CURIOUS, intensity: 75 }
    }

    const reaction = reactions[gesture.gesture]
    if (reaction) {
      get().setEmotion(reaction.type, reaction.intensity, `Gesture detected: ${gesture.gesture}`, 'gesture')
    }
  },

  // React to chat message
  reactToMessage: (message) => {
    const msg = message.toLowerCase()
    
    if (/shout|yell|stop|screaming|hey!|wake up!/i.test(msg) || (message === message.toUpperCase() && message.length > 4)) {
      get().setEmotion(EMOTION_TYPES.SHOUTING, 90, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/angry|mad|furious|hate|annoyed|shut up/i.test(msg)) {
      get().setEmotion(EMOTION_TYPES.ANGRY, 85, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/wave|hi|hello|hey|greetings|bye/i.test(msg)) {
      get().setEmotion(EMOTION_TYPES.WAVING, 80, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/tease|troll|fool|joke|lol|haha|tongue|silly/i.test(msg)) {
      get().setEmotion(EMOTION_TYPES.TEASING, 85, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/sad|cry|hurt|sorry|unhappy|depressed/i.test(msg)) {
      get().setEmotion(EMOTION_TYPES.SAD, 80, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/what|wow|omg|surprise|really|whoa|amazing/i.test(msg)) {
      get().setEmotion(EMOTION_TYPES.SURPRISED, 85, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/confused|huh|why|how|idk|dont understand/i.test(msg)) {
      get().setEmotion(EMOTION_TYPES.CONFUSED, 75, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/tired|sleepy|night|bored|nap/i.test(msg)) {
      get().setEmotion(EMOTION_TYPES.SLEEPY, 70, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/happy|good|great|awesome|love|yay|nice/i.test(msg)) {
      get().setEmotion(EMOTION_TYPES.HAPPY, 80, `Message: "${message.slice(0, 30)}"`, 'message')
    } else if (/\?/.test(msg)) {
      get().setEmotion(EMOTION_TYPES.CURIOUS, 75, `Question asked: "${message.slice(0, 30)}"`, 'message')
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
      angry: '#ef4444', // red
      shouting: '#ff4500', // orange-red
      waving: '#38bdf8', // sky blue
      teasing: '#ec4899', // pink
      sad: '#3b82f6', // blue
      surprised: '#a855f7', // purple
      confused: '#eab308', // yellow
      sleepy: '#8b5cf6', // violet
      excited: '#10b981', // emerald
      curious: '#06b6d4', // cyan
      concerned: '#f97316', // orange
      neutral: '#9ca3af' // gray
    }
    return colors[get().currentEmotion.type] || '#9ca3af'
  },

  // Reset to neutral
  reset: () => {
    get().setEmotion(EMOTION_TYPES.NEUTRAL, 50, 'Reset')
  }
}))

