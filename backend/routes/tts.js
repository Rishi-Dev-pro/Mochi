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

    if (trimmed.length > 3000) {
      return res.status(400).json({ error: 'Text exceeds maximum limit of 3000 characters' })
    }

    const audioBuffer = await generateSpeechAudio(trimmed)

    const isWav = audioBuffer.length >= 4 && audioBuffer.subarray(0, 4).toString('ascii') === 'RIFF'
    const contentType = isWav ? 'audio/wav' : 'audio/mpeg'

    res.set({
      'Content-Type': contentType,
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    })

    return res.send(audioBuffer)
  } catch (err) {
    console.error('[TTS Handler] Error generating speech:', err)
    return res.status(500).json({ error: err.message || 'TTS synthesis failed' })
  }
}
