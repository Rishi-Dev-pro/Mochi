/**
 * Backend Text-to-Speech (TTS) Service
 *
 * High-quality natural audio synthesizer for Mochi Companion.
 * - Primary: High-fidelity natural speech engine via standard Google TTS chunking.
 * - Secondary: Piper TTS CLI if configured.
 * - Fallback: Built-in zero-dependency formant synthesizer.
 */

import { spawn } from 'child_process'
import fs from 'fs'
import https from 'https'
import http from 'http'

// Standard WAV Header Generator (16-bit PCM Mono)
function createWavHeader(dataLength, sampleRate = 22050) {
  const buffer = Buffer.alloc(44)
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataLength, 4)
  buffer.write('WAVE', 8)

  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)

  buffer.write('data', 36)
  buffer.writeUInt32LE(dataLength, 40)

  return buffer
}

/**
 * Fetch a single audio segment from Google TTS API
 */
function fetchGoogleTtsSegment(text, lang = 'en') {
  return new Promise((resolve, reject) => {
    const cleanText = encodeURIComponent(text)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=${lang}&client=tw-ob`

    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 6000
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`TTS API returned HTTP ${res.statusCode}`))
        }
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
      }
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('TTS request timed out'))
    })
  })
}

/**
 * Split text into natural conversational chunks (<150 chars) for fluid speech synthesis
 */
function splitTextForTts(text, maxLen = 140) {
  const clean = text
    .replace(/<[^>]*>/g, '') // strip HTML/XML tags
    .replace(/[*_#`~]/g, '') // strip markdown
    .trim()

  if (!clean) return []

  const sentenceRegex = /[^.!?]+[.!?]+|[^.!?]+$/g
  const sentences = clean.match(sentenceRegex) || [clean]
  const chunks = []
  let current = ''

  for (const s of sentences) {
    const trimmed = s.trim()
    if (!trimmed) continue

    if ((current + ' ' + trimmed).trim().length <= maxLen) {
      current = (current + ' ' + trimmed).trim()
    } else {
      if (current) chunks.push(current)
      if (trimmed.length <= maxLen) {
        current = trimmed
      } else {
        const words = trimmed.split(' ')
        let sub = ''
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim()
          } else {
            if (sub) chunks.push(sub)
            sub = w
          }
        }
        current = sub
      }
    }
  }
  if (current) chunks.push(current)
  return chunks.length > 0 ? chunks : [clean.slice(0, maxLen)]
}

/**
 * Natural speech synthesis using Google TTS
 */
async function synthesizeWithNaturalTts(text) {
  const chunks = splitTextForTts(text)
  if (chunks.length === 0) {
    return Buffer.alloc(0)
  }

  const audioBuffers = []
  for (const chunk of chunks) {
    const audio = await fetchGoogleTtsSegment(chunk, 'en')
    audioBuffers.push(audio)
  }

  return Buffer.concat(audioBuffers)
}

const VOWEL_FORMANTS = {
  a: [730, 1090, 2440],
  e: [530, 1840, 2480],
  i: [270, 2290, 3010],
  o: [570, 840, 2410],
  u: [300, 870, 2240]
}

/**
 * Built-in Local Acoustic Formant Speech Synthesizer (Offline Fallback)
 */
function synthesizeAcousticSpeechWav(text, sampleRate = 22050) {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s.,!?']/g, '')
  const words = clean.split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return Buffer.concat([createWavHeader(0, sampleRate)])
  }

  const basePitch = 195
  const samples = []
  let currentPhase = 0

  for (let w = 0; w < words.length; w++) {
    const word = words[w]

    for (let c = 0; c < word.length; c++) {
      const char = word[c]
      const isVowel = 'aeiou'.includes(char)
      const formants = VOWEL_FORMANTS[char] || VOWEL_FORMANTS.e
      const durationMs = isVowel ? 130 : 60
      const charSamples = Math.floor((durationMs / 1000) * sampleRate)

      for (let i = 0; i < charSamples; i++) {
        const progress = i / charSamples
        let env = 1.0
        if (progress < 0.15) env = progress / 0.15
        else if (progress > 0.8) env = (1.0 - progress) / 0.2

        const pitchBend = Math.sin((c / word.length + progress * 0.5) * Math.PI) * 18
        const currentPitch = basePitch + pitchBend

        currentPhase += (2 * Math.PI * currentPitch) / sampleRate

        let val = 0
        if (isVowel) {
          const f0 = Math.sin(currentPhase) * 0.4
          const f1 = Math.sin(currentPhase * (formants[0] / currentPitch)) * 0.35
          const f2 = Math.sin(currentPhase * (formants[1] / currentPitch)) * 0.2
          const f3 = Math.sin(currentPhase * (formants[2] / currentPitch)) * 0.08
          val = (f0 + f1 + f2 + f3) * env * 0.75
        } else {
          const noise = (Math.random() * 2 - 1) * 0.25
          const tone = Math.sin(currentPhase * 1.5) * 0.15
          val = (noise + tone) * env * 0.4
        }

        const sample16 = Math.max(-32768, Math.min(32767, Math.floor(val * 24000)))
        samples.push(sample16)
      }
    }

    const pauseSamples = Math.floor(0.08 * sampleRate)
    for (let p = 0; p < pauseSamples; p++) {
      samples.push(0)
    }
  }

  const pcmBuffer = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    pcmBuffer.writeInt16LE(samples[i], i * 2)
  }

  const header = createWavHeader(pcmBuffer.length, sampleRate)
  return Buffer.concat([header, pcmBuffer])
}

/**
 * Execute Piper binary if available on server
 */
async function synthesizeWithPiper(text, piperPath, modelPath) {
  return new Promise((resolve, reject) => {
    try {
      const piperProcess = spawn(piperPath, ['--model', modelPath, '--output_file', '-'], {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      const chunks = []
      let errData = ''

      piperProcess.stdout.on('data', (chunk) => {
        chunks.push(chunk)
      })

      piperProcess.stderr.on('data', (data) => {
        errData += data.toString()
      })

      piperProcess.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks))
        } else {
          reject(new Error(`Piper exited with code ${code}: ${errData}`))
        }
      })

      piperProcess.on('error', (err) => {
        reject(err)
      })

      piperProcess.stdin.write(text)
      piperProcess.stdin.end()
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Main TTS entry point
 * @param {string} text
 * @returns {Promise<Buffer>} Audio buffer (MP3 or WAV)
 */
export async function generateSpeechAudio(text) {
  if (text === null || text === undefined || typeof text !== 'string') {
    throw new Error('Invalid text payload')
  }

  const cleanText = text.trim()
  if (!cleanText) {
    throw new Error('Empty text payload')
  }

  // 1. Try High-Quality Natural Speech Engine (Google TTS)
  try {
    const naturalAudio = await synthesizeWithNaturalTts(cleanText)
    if (naturalAudio && naturalAudio.length > 100) {
      return naturalAudio
    }
  } catch (err) {
    console.warn('[TtsService] Natural TTS online request notice:', err.message)
  }

  // 2. Try Piper TTS if configured
  const piperPath = process.env.PIPER_PATH
  const piperModel = process.env.PIPER_MODEL

  if (piperPath && piperModel && fs.existsSync(piperPath) && fs.existsSync(piperModel)) {
    try {
      return await synthesizeWithPiper(cleanText, piperPath, piperModel)
    } catch (err) {
      console.warn('[TtsService] Piper execution notice:', err.message)
    }
  }

  // 3. Fallback to local acoustic formant synthesizer
  return synthesizeAcousticSpeechWav(cleanText, 22050)
}
