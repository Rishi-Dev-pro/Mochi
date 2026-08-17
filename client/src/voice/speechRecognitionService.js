/**
 * Speech Recognition Service (STT)
 *
 * Wrapper around Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * with robust session resilience, interim transcript streaming, and seamless hands-free operation.
 */

import { STT_CONFIG } from './config'

export const STT_EVENTS = {
  INTERIM_RESULT: 'interim_result',
  FINAL_RESULT: 'final_result',
  START: 'start',
  END: 'end',
  ERROR: 'error'
}

export class SpeechRecognitionService {
  constructor(config = {}) {
    this.config = { ...STT_CONFIG, ...config }

    this.recognition = null
    this.isListening = false
    this.shouldBeListening = false
    this.consecutiveErrors = 0
    this.restartTimeoutId = null

    // Transcripts buffer
    this.currentInterimText = ''
    this.accumulatedFinalText = ''

    // Event listeners
    this.listeners = new Map()
  }

  /**
   * Check if browser has SpeechRecognition support
   */
  isSupported() {
    if (typeof window === 'undefined') return false
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }


  /**
   * Register event callbacks
   * @param {string} event
   * @param {Function} callback
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
          console.error(`[STT] Error in listener for ${event}:`, err)
        }
      }
    }
  }

  /**
   * Start speech recognition
   */
  start() {
    if (!this.isSupported()) {
      const err = new Error('SpeechRecognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      this.emit(STT_EVENTS.ERROR, { error: 'unsupported', message: err.message })
      throw err
    }

    this.shouldBeListening = true
    this.consecutiveErrors = 0
    this.currentInterimText = ''
    this.accumulatedFinalText = ''

    this._startInstance()
  }

  _startInstance() {
    if (this.recognition) {
      this._destroyInstance()
    }

    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognitionClass()
      this.recognition.continuous = this.config.continuous
      this.recognition.interimResults = this.config.interimResults
      this.recognition.lang = this.config.lang

      this.recognition.onstart = () => {
        this.isListening = true
        this.consecutiveErrors = 0
        this.emit(STT_EVENTS.START)
      }

      this.recognition.onresult = (event) => {
        let interim = ''
        let newlyFinalized = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcriptPiece = result[0]?.transcript || ''

          if (result.isFinal) {
            newlyFinalized += (newlyFinalized ? ' ' : '') + transcriptPiece.trim()
          } else {
            interim += (interim ? ' ' : '') + transcriptPiece
          }
        }

        this.currentInterimText = interim

        if (newlyFinalized) {
          const cleanFinal = newlyFinalized.trim()
          this.accumulatedFinalText = this.accumulatedFinalText
            ? `${this.accumulatedFinalText} ${cleanFinal}`
            : cleanFinal

          this.emit(STT_EVENTS.FINAL_RESULT, {
            text: this.accumulatedFinalText,
            chunk: cleanFinal,
            timestamp: Date.now()
          })

          // Reset interim & accumulated final after delivering
          this.currentInterimText = ''
          this.accumulatedFinalText = ''
        } else if (interim) {
          this.emit(STT_EVENTS.INTERIM_RESULT, {
            text: interim,
            timestamp: Date.now()
          })
        }
      }

      this.recognition.onerror = (event) => {
        // 'no-speech' is a normal occurrence in continuous listening; do not count as fatal error
        if (event.error === 'no-speech') {
          return
        }

        console.warn('[STT] Speech recognition warning/error:', event.error)
        this.consecutiveErrors++

        this.emit(STT_EVENTS.ERROR, {
          error: event.error,
          message: event.message || `Speech recognition error: ${event.error}`
        })

        if (this.consecutiveErrors >= this.config.maxConsecutiveErrors) {
          console.error('[STT] Max consecutive recognition errors reached. Halting auto-restart.')
          this.shouldBeListening = false
        }
      }

      this.recognition.onend = () => {
        this.isListening = false
        this.emit(STT_EVENTS.END)

        // If recognition closed but voice mode is still desired, auto-restart cleanly
        if (this.shouldBeListening && this.consecutiveErrors < this.config.maxConsecutiveErrors) {
          if (this.restartTimeoutId) clearTimeout(this.restartTimeoutId)
          this.restartTimeoutId = setTimeout(() => {
            if (this.shouldBeListening) {
              this._startInstance()
            }
          }, this.config.restartDelayMs)
        }
      }

      this.recognition.start()
    } catch (err) {
      console.error('[STT] Failed to start SpeechRecognition:', err)
      this.isListening = false
      this.emit(STT_EVENTS.ERROR, { error: 'start_failed', message: err.message })
    }
  }

  /**
   * Flush any remaining interim transcript as final (e.g. when VAD triggers speech end)
   */
  finalizeCurrentUtterance() {
    if (this.currentInterimText || this.accumulatedFinalText) {
      const textToFinalize = (this.accumulatedFinalText + ' ' + this.currentInterimText).trim()
      if (textToFinalize) {
        this.emit(STT_EVENTS.FINAL_RESULT, {
          text: textToFinalize,
          chunk: textToFinalize,
          timestamp: Date.now()
        })
      }
      this.currentInterimText = ''
      this.accumulatedFinalText = ''
      this.emit(STT_EVENTS.INTERIM_RESULT, { text: '', timestamp: Date.now() })
    }
  }

  _destroyInstance() {
    if (this.restartTimeoutId) {
      clearTimeout(this.restartTimeoutId)
      this.restartTimeoutId = null
    }

    if (this.recognition) {
      try {
        this.recognition.onstart = null
        this.recognition.onresult = null
        this.recognition.onerror = null
        this.recognition.onend = null
        this.recognition.stop()
      } catch (err) {
        // Ignore stop error on unmount/cleanup
      }
      this.recognition = null
    }
    this.isListening = false
  }

  /**
   * Stop speech recognition and clean up instances
   */
  stop() {
    this.shouldBeListening = false
    this.consecutiveErrors = 0
    this.currentInterimText = ''
    this.accumulatedFinalText = ''
    this._destroyInstance()
    this.emit(STT_EVENTS.END)
  }

  getIsListening() {
    return this.isListening
  }
}

export const speechRecognitionService = new SpeechRecognitionService()
