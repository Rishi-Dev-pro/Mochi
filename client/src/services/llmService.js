const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '/api'

export async function chat(userMessage, emotionContext) {
  // Build emotion-aware system prompt
  const emotionInstructions = emotionContext?.emotionAwareness
    ? `
IMPORTANT: User Emotion Context
${emotionContext.instructions}

Adapt your response style to match this emotion.
${emotionContext.contextualExample}
`
    : ''

  const systemPrompt = `You are Mochi, a persistent 3D AI companion with genuine emotional intelligence.

Core Traits:
- Empathetic and aware of user emotions
- Conversational and warm
- Helpful and supportive
- Curious and engaged

${emotionInstructions}

Respond naturally and briefly (1-3 sentences max for faster interaction).
Remember: You can sense the user's emotions through facial recognition.
Occasionally end responses with an emotion tag: <emotion type="happy|curious|concerned|sleepy|excited|neutral" intensity="0-100"/>
`

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        systemPrompt: systemPrompt
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.response !== undefined ? data.response : data
  } catch (error) {
    console.error('Chat error:', error)
    return 'Sorry, I had trouble understanding. Can you try again?'
  }
}

export async function sendChatMessage(message, conversationHistory = [], emotionContext = null) {
  if (typeof message === 'string' && (emotionContext || !Array.isArray(conversationHistory))) {
    return chat(message, emotionContext)
  }

  try {
    let userMsg = message
    let history = conversationHistory

    if (Array.isArray(message)) {
      history = message.slice(0, message.length - 1)
      userMsg = message[message.length - 1]?.content || ''
    }

    const emotionInstructions = emotionContext?.emotionAwareness
      ? `
IMPORTANT: User Emotion Context
${emotionContext.instructions}
`
      : ''

    const systemPrompt = `You are Mochi, a persistent 3D AI companion with genuine emotional intelligence.

Core Traits:
- Empathetic and aware of user emotions
- Conversational and warm
- Helpful and supportive
- Curious and engaged

${emotionInstructions}

Respond naturally and briefly (1-2 sentences max).
`

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMsg,
        conversationHistory: history,
        systemPrompt: systemPrompt
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.response !== undefined ? data.response : data
  } catch (error) {
    console.error('LLM Service Error:', error.message)
    throw new Error(`Failed to get response: ${error.message}`)
  }
}

const VALID_EMOTIONS = new Set([
  'happy',
  'angry',
  'shouting',
  'waving',
  'teasing',
  'sad',
  'surprised',
  'confused',
  'sleepy',
  'excited',
  'curious',
  'concerned',
  'neutral'
])

export function parseEmotionFromResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { type: 'neutral', intensity: 50, text: '' }
  }

  // Regex handles:
  // 1) <emotion type="happy" intensity="85"/>
  // 2) <emotion type="happy" intensity="0.85">content</emotion>
  // 3) <emotion type='happy' intensity='85'>
  const emotionRegex = /<emotion\s+type=["']([a-zA-Z]+)["'](?:\s+intensity=["']([0-9.]+)["'])?\s*(?:\/>|>([\s\S]*?)<\/emotion>|>)/i
  const match = rawText.match(emotionRegex)

  let extractedType = 'neutral'
  let extractedIntensity = 65

  if (match) {
    const rawType = match[1]?.toLowerCase()
    if (VALID_EMOTIONS.has(rawType)) {
      extractedType = rawType
    } else if (rawType === 'calm' || rawType === 'peaceful') {
      extractedType = 'neutral'
    } else if (rawType === 'joy' || rawType === 'cheerful') {
      extractedType = 'happy'
    }

    if (match[2] !== undefined) {
      const parsedNum = parseFloat(match[2])
      if (!isNaN(parsedNum)) {
        // If intensity is represented as a decimal fraction (0.0 - 1.0), scale to 0 - 100
        extractedIntensity = parsedNum <= 1.0 && parsedNum > 0 ? Math.round(parsedNum * 100) : Math.round(parsedNum)
        extractedIntensity = Math.max(0, Math.min(100, extractedIntensity))
      }
    }
  }

  // Clean all emotion markup from the text
  const cleanText = rawText
    .replace(/<emotion[^>]*>[\s\S]*?<\/emotion>/gi, (m) => {
      // Extract inner content if present
      const inner = m.replace(/<\/?emotion[^>]*>/gi, '')
      return inner
    })
    .replace(/<\/?emotion[^>]*\/?>/gi, '')
    .trim()

  return {
    type: extractedType,
    intensity: extractedIntensity,
    text: cleanText || rawText.trim()
  }
}

