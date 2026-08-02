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

export function parseEmotionFromResponse(text) {
  if (!text) return { type: 'neutral', intensity: 50, text: '' }

  const emotionMatch = text.match(/<emotion type="([^"]+)" intensity="(\d+)"\/>/)
  if (!emotionMatch) return { type: 'neutral', intensity: 50, text }

  return {
    type: emotionMatch[1],
    intensity: parseInt(emotionMatch[2]),
    text: text.replace(emotionMatch[0], '').trim(),
  }
}
