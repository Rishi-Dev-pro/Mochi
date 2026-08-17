/**
 * TTS Route Handler
 * POST /api/tts
 */

import { generateSpeechAudio } from '../services/ttsService.js'

export async function handleTtsRequest(req, res) {
  try {
    const { text } = req.body

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required in request body' })
    }

    const trimmed = text.trim()
    if (!trimmed) {
      return res.status(400).json({ error: 'Text cannot be empty or whitespace only' })
    }

    // Limit maximum sentence length per request to 3000 chars for safety
    if (trimmed.length > 3000) {
      return res.status(400).json({ error: 'Text exceeds maximum limit of 3000 characters' })
    }

    const wavBuffer = await generateSpeechAudio(trimmed)

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': wavBuffer.length,
      'Cache-Control': 'no-cache'
    })

    return res.send(wavBuffer)
  } catch (err) {
    console.error('[TTS Handler] Error generating speech:', err)
    return res.status(500).json({ error: err.message || 'TTS synthesis failed' })
  }
}
