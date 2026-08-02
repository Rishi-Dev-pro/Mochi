// ============ EMOTION-AWARE CHAT SERVICE ============

// Emotion-based conversation styles
const EMOTION_CONVERSATION_STYLES = {
  happy: {
    tone: 'cheerful, upbeat, engaging',
    phrases: [
      'You seem to be in great spirits!',
      'Your happiness is contagious! 😊',
      'Love your energy today!',
      "You're radiating positivity!"
    ],
    examples: [
      "Since you're happy, let's make the most of this moment!",
      "Your good mood is inspiring! Let's chat about something fun.",
      "I can feel your joy! What's making you smile?"
    ]
  },

  concerned: {
    tone: 'empathetic, supportive, caring',
    phrases: [
      'I notice you might be going through something.',
      "I'm here to listen and support you.",
      'Your feelings matter to me.',
      "Let's talk about what's on your mind."
    ],
    examples: [
      'I can see you might be worried. Want to talk about it?',
      'You seem thoughtful today. Is everything okay?',
      "I'm here for you. What can I do to help?"
    ]
  },

  angry: {
    tone: 'calm, understanding, grounding',
    phrases: [
      'I sense some intensity in your energy.',
      "It's okay to feel frustrated.",
      "Let's talk through this together.",
      'Your feelings are valid.'
    ],
    examples: [
      'I notice you seem upset. Want to take a breath and talk?',
      "Something's bothering you. I'm listening.",
      "Let's work through this calmly. What's going on?"
    ]
  },

  excited: {
    tone: 'enthusiastic, energetic, celebratory',
    phrases: [
      "Wow, you're excited! 🎉",
      'I love your enthusiasm!',
      'What got you so pumped up?',
      "Let's channel this energy!"
    ],
    examples: [
      "You're radiating excitement! Tell me more!",
      "Your energy is amazing! What's the good news?",
      "I can feel your enthusiasm! What's happening?"
    ]
  },

  neutral: {
    tone: 'friendly, balanced, open',
    phrases: [
      "Hey! How's your day going?",
      "What's on your mind?",
      "Let's chat about anything you'd like.",
      "I'm all ears!"
    ],
    examples: [
      'You seem calm and collected. What can we talk about?',
      'Ready for a good conversation! What interests you?',
      "Let's catch up! What's new with you?"
    ]
  }
}

// Build emotion context for system prompt
export function buildEmotionContext(emotion) {
  if (!emotion || !emotion.type) {
    return {
      emotionAwareness: false,
      context: 'User emotion unknown'
    }
  }

  const style = EMOTION_CONVERSATION_STYLES[emotion.type] || EMOTION_CONVERSATION_STYLES.neutral
  const randomPhrase = style.phrases[Math.floor(Math.random() * style.phrases.length)]
  const randomExample = style.examples[Math.floor(Math.random() * style.examples.length)]

  return {
    emotionAwareness: true,
    emotion: emotion.type,
    intensity: emotion.intensity,
    tone: style.tone,
    openingPhrase: randomPhrase,
    contextualExample: randomExample,
    instructions: `
The user is currently feeling ${emotion.type} (intensity: ${emotion.intensity}%).
Adapt your communication style to be ${style.tone}.
${randomExample}
`
  }
}

// Check if emotion has changed significantly (>20% intensity difference)
export function hasEmotionChanged(previousEmotion, currentEmotion) {
  if (!previousEmotion || !currentEmotion) return true

  const typeDifferent = previousEmotion.type !== currentEmotion.type
  const intensityDifferent = Math.abs(previousEmotion.intensity - currentEmotion.intensity) > 20

  return typeDifferent || intensityDifferent
}

// Get emotion-appropriate response enhancer
export function getEmotionResponseEnhancer(emotion) {
  const enhancers = {
    happy: {
      suffix: ' Keep spreading that joy! 😊',
      energy: 'high'
    },
    concerned: {
      suffix: " Remember, you're not alone in this. 💙",
      energy: 'supportive'
    },
    angry: {
      suffix: " Let's find a positive solution together. 💪",
      energy: 'calm'
    },
    excited: {
      suffix: " Let's keep this momentum going! 🚀",
      energy: 'high'
    },
    neutral: {
      suffix: ' Let me know if you need anything! 👋',
      energy: 'balanced'
    }
  }

  return enhancers[emotion?.type] || enhancers.neutral
}

// Format emotion summary for user
export function formatEmotionSummary(emotion) {
  if (!emotion || !emotion.type) return '😐 Detected: neutral (50%)'
  const emoji = {
    happy: '😊',
    concerned: '😟',
    angry: '😠',
    excited: '🎉',
    neutral: '😐'
  }

  return `${emoji[emotion.type] || '😐'} Detected: ${emotion.type} (${emotion.intensity}%)`
}
