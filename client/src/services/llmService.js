const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '/api'

export async function sendChatMessage(message, conversationHistory = []) {
  try {
    let userMsg = message
    let history = conversationHistory

    if (Array.isArray(message)) {
      history = message.slice(0, message.length - 1)
      userMsg = message[message.length - 1]?.content || ''
    }

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMsg,
        conversationHistory: history,
      }),
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
