import {
  NVIDIA_API_KEY,
  NVIDIA_API_URL,
  NVIDIA_MODEL,
  MOCHI_SYSTEM_PROMPT
} from '../config/nvidiaConfig.js'

export async function sendMessage(req, res) {
  try {
    const { message, conversationHistory = [], systemPrompt } = req.body

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message required and must be string' })
    }

    if (systemPrompt && systemPrompt.includes('User Emotion Context')) {
      console.log('📊 Emotion-aware response triggered')
    }

    const apiKey = NVIDIA_API_KEY || process.env.NVIDIA_API_KEY

    if (!apiKey) {
      console.error('NVIDIA_API_KEY not set in .env')
      return res.status(500).json({ error: 'Server API key not configured' })
    }

    // Build message history for Nvidia (OpenAI format)
    const messages = [
      { role: 'system', content: systemPrompt || MOCHI_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // Call Nvidia API (server-to-server, no CORS)
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9
      })
    })

    // Handle API response
    if (!response.ok) {
      const errorText = await response.text()
      let errorJson = {}
      try {
        errorJson = JSON.parse(errorText)
      } catch (e) {}

      console.error('Nvidia API Error:', response.status, errorText)

      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid Nvidia API key' })
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limited. Try again in a moment.' })
      }
      if (response.status === 503) {
        return res.status(503).json({ error: 'Nvidia API overloaded. Try again later.' })
      }

      return res.status(response.status).json({
        error: errorJson.error?.message || errorText || 'Nvidia API error'
      })
    }

    const data = await response.json()

    // Extract response text (OpenAI format)
    const responseText =
      data.choices?.[0]?.message?.content || 'Sorry, I could not respond.'

    // Return response to frontend
    res.json({
      success: true,
      response: responseText,
      model: NVIDIA_MODEL
    })
  } catch (error) {
    console.error('Chat Error:', error.message)
    res.status(500).json({ error: `Failed to get response: ${error.message}` })
  }
}
