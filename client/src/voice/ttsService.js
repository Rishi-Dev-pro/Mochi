/**
 * Text-to-Speech (TTS) Service
 *
 * Provider-agnostic speech synthesis service.
 * Coordinates speech output with the Web Audio Engine and AnalyserNode for real-time amplitude tracking.
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
    this.activeUtterance = null
    this.listeners = new Map()
    this.boundaryIntervalId = null

    // Subscribe to real-time audio engine amplitude updates
    audioEngine.on(AUDIO_ENGINE_EVENTS.AMPLITUDE, (amp) => {
      this.emit('amplitude', amp)
    })
  }

  /**
   * Check if speech synthesis is supported in current environment
   */
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
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
   * Synthesize and speak response text out loud
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

    // Interrupt previous speech if currently speaking (latest response replaces old)
    this.stop()

    if (!this.isSupported()) {
      console.warn('[TtsService] Speech synthesis is not supported in this browser.')
      this._setState(TTS_STATES.ERROR)
      this.emit(TTS_EVENTS.ERROR, { message: 'Speech synthesis not supported' })
      return false
    }

    this._setState(TTS_STATES.PREPARING)

    const mergedConfig = { ...this.config, ...overrideConfig }

    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.lang = mergedConfig.lang || 'en-US'
        utterance.rate = mergedConfig.rate || 1.05
        utterance.pitch = mergedConfig.pitch || 1.15
        utterance.volume = mergedConfig.volume !== undefined ? mergedConfig.volume : 1.0

        // Select suitable warm English voice if available
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          const selectedVoice =
            voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
            voices.find((v) => v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny')) ||
            voices.find((v) => v.lang.startsWith('en'))
          if (selectedVoice) {
            utterance.voice = selectedVoice
          }
        }

        this.activeUtterance = utterance

        utterance.onstart = () => {
          this._setState(TTS_STATES.SPEAKING)
          audioEngine.startAnalysis()
          this.emit(TTS_EVENTS.START, { text: cleanText })

          // Simulate organic speech energy modulation during utterance
          this._startBoundarySimulation()
        }

        utterance.onboundary = (event) => {
          // Increase target amplitude on word boundaries
          const randomSpike = 0.4 + Math.random() * 0.45
          audioEngine.setTargetAmplitude(randomSpike)
        }

        utterance.onend = () => {
          this._stopBoundarySimulation()
          audioEngine.stop()
          this._setState(TTS_STATES.COMPLETED)
          this.emit(TTS_EVENTS.END, { text: cleanText })
          this.activeUtterance = null

          // Return to IDLE shortly after finish
          setTimeout(() => {
            if (this.state === TTS_STATES.COMPLETED) {
              this._setState(TTS_STATES.IDLE)
            }
          }, 400)

          resolve(true)
        }

        utterance.onerror = (event) => {
          // 'interrupted' or 'canceled' are normal stop occurrences
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            console.warn('[TtsService] Speech synthesis error:', event.error)
            this._setState(TTS_STATES.ERROR)
            this.emit(TTS_EVENTS.ERROR, { error: event.error })
          }
          this._stopBoundarySimulation()
          audioEngine.stop()
          this.activeUtterance = null
          resolve(false)
        }

        window.speechSynthesis.speak(utterance)
      } catch (err) {
        console.error('[TtsService] Failed to speak:', err)
        this._stopBoundarySimulation()
        audioEngine.stop()
        this._setState(TTS_STATES.ERROR)
        this.emit(TTS_EVENTS.ERROR, { error: err.message })
        resolve(false)
      }
    })
  }

  _startBoundarySimulation() {
    this._stopBoundarySimulation()
    this.boundaryIntervalId = setInterval(() => {
      if (this.state === TTS_STATES.SPEAKING) {
        // Natural speech syllabic fluctuation: baseline between 0.35 and 0.8
        const dynamicEnergy = 0.3 + Math.sin(Date.now() * 0.015) * 0.25 + Math.random() * 0.2
        audioEngine.setTargetAmplitude(Math.max(0.1, Math.min(1.0, dynamicEnergy)))
      }
    }, 90)
  }

  _stopBoundarySimulation() {
    if (this.boundaryIntervalId) {
      clearInterval(this.boundaryIntervalId)
      this.boundaryIntervalId = null
    }
  }

  /**
   * Stop active speech synthesis immediately
   */
  stop() {
    this._stopBoundarySimulation()

    if (this.isSupported() && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.cancel()
      } catch (e) {}
    }

    audioEngine.stop()
    this.activeUtterance = null

    if (this.state === TTS_STATES.SPEAKING || this.state === TTS_STATES.PREPARING) {
      this._setState(TTS_STATES.IDLE)
      this.emit(TTS_EVENTS.END, { interrupted: true })
    }
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      this._setState(TTS_STATES.PAUSED)
      audioEngine.stop()
      this.emit(TTS_EVENTS.PAUSE)
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      this._setState(TTS_STATES.SPEAKING)
      audioEngine.startAnalysis()
      this.emit(TTS_EVENTS.RESUME)
    }
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
