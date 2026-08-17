/**
 * Text-to-Speech (TTS) Service
 *
 * Client-side TTS orchestrator that requests real audio from the backend local TTS engine
 * and streams it through the Web Audio pipeline for genuine amplitude analysis.
 */

import { TTS_CONFIG, TTS_STATES } from './config'
import { audioEngine, AUDIO_ENGINE_EVENTS } from './audioEngine'

export const TTS_EVENTS = {
  START: 'start',
  END: 'end',
  PAUSE: 'pause',
  RESUME: 'resume',
  ERROR: 'error',
  STATE_CHANGE: 'state_change'
}

export class TtsService {
  constructor(config = {}) {
    this.config = { ...TTS_CONFIG, ...config }
    this.state = TTS_STATES.IDLE
    this.activeAbortController = null
    this.listeners = new Map()

    // Subscribe to real-time audio engine amplitude updates
    audioEngine.on(AUDIO_ENGINE_EVENTS.AMPLITUDE, (amp) => {
      this.emit('amplitude', amp)
    })
  }

  /**
   * Check if Web Audio API is supported in current environment
   */
  isSupported() {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)
  }

  /**
   * Register event listener
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.listeners.get(event)?.delete(callback)
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(data)
        } catch (err) {
          console.error(`[TtsService] Listener error for ${event}:`, err)
        }
      }
    }
  }

  _setState(newState) {
    this.state = newState
    this.emit(TTS_EVENTS.STATE_CHANGE, { state: newState })
  }

  /**
   * Synthesize and speak response text out loud using real backend audio
   * @param {string} text
   * @param {Object} [overrideConfig]
   * @returns {Promise<boolean>}
   */
  async speak(text, overrideConfig = {}) {
    if (!text || typeof text !== 'string') {
      return false
    }

    const cleanText = text.trim()
    if (!cleanText) {
      return false
    }

    // Interrupt previous speech/fetch if currently active
    this.stop()

    if (!this.isSupported()) {
      console.warn('[TtsService] Web Audio API is not supported in this browser.')
      this._setState(TTS_STATES.ERROR)
      this.emit(TTS_EVENTS.ERROR, { message: 'Web Audio not supported' })
      return false
    }

    this._setState(TTS_STATES.PREPARING)

    const abortController = new AbortController()
    this.activeAbortController = abortController

    try {
      // Request real WAV audio from local backend TTS service
      const backendUrl = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`TTS server responded with HTTP ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      if (abortController.signal.aborted) {
        return false
      }

      // Decode audio data using browser Web Audio Context
      const ctx = audioEngine.getOrCreateContext()
      if (!ctx) {
        throw new Error('AudioContext unavailable')
      }

      // decodeAudioData returns an AudioBuffer containing actual PCM samples
      const audioBuffer = await new Promise((resolve, reject) => {
        ctx.decodeAudioData(
          arrayBuffer.slice(0),
          (decoded) => resolve(decoded),
          (err) => reject(err || new Error('Failed to decode audio data'))
        )
      })

      if (abortController.signal.aborted) {
        return false
      }

      this._setState(TTS_STATES.SPEAKING)
      this.emit(TTS_EVENTS.START, { text: cleanText })

      // Play real audio buffer through AnalyserNode and GainNode to speakers
      await audioEngine.playAudioBuffer(audioBuffer)

      this._setState(TTS_STATES.COMPLETED)
      this.emit(TTS_EVENTS.END, { text: cleanText })

      // Reset to IDLE shortly after completion
      setTimeout(() => {
        if (this.state === TTS_STATES.COMPLETED) {
          this._setState(TTS_STATES.IDLE)
        }
      }, 300)

      this.activeAbortController = null
      return true
    } catch (err) {
      if (err.name === 'AbortError') {
        // Normal interruption, not an error
        return false
      }

      console.error('[TtsService] Speech playback failed:', err)
      audioEngine.stop()
      this._setState(TTS_STATES.ERROR)
      this.emit(TTS_EVENTS.ERROR, { error: err.message })
      this.activeAbortController = null
      return false
    }
  }

  /**
   * Stop active speech playback immediately
   */
  stop() {
    if (this.activeAbortController) {
      this.activeAbortController.abort()
      this.activeAbortController = null
    }

    audioEngine.stop()

    if (this.state === TTS_STATES.SPEAKING || this.state === TTS_STATES.PREPARING) {
      this._setState(TTS_STATES.IDLE)
      this.emit(TTS_EVENTS.END, { interrupted: true })
    }
  }

  /**
   * Pause speech
   */
  pause() {
    audioEngine.stop()
    this._setState(TTS_STATES.PAUSED)
    this.emit(TTS_EVENTS.PAUSE)
  }

  /**
   * Returns true if TTS is currently synthesizing/speaking
   */
  isSpeaking() {
    return this.state === TTS_STATES.SPEAKING
  }

  /**
   * Get current state
   */
  getState() {
    return this.state
  }
}

export const ttsService = new TtsService()
