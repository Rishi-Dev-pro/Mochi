/**
 * Voice Activity Detector (VAD)
 *
 * Deterministic, Web Audio API-based energy & spectral analyzer.
 * Robust against background hum and click transients via confirmation delays and silence hold timers.
 */

import { VAD_CONFIG } from './config'

export const VAD_EVENTS = {
  SPEECH_START: 'speech_start',
  SPEECH_END: 'speech_end',
  AUDIO_LEVEL: 'audio_level',
  STATE_CHANGE: 'state_change'
}

export class VoiceActivityDetector {
  constructor(config = {}) {
    this.config = { ...VAD_CONFIG, ...config }

    this.audioContext = null
    this.sourceNode = null
    this.analyserNode = null
    this.animationFrameId = null

    // VAD internal state
    this.isAnalyzing = false
    this.isSpeaking = false
    this.speechStartTime = 0
    this.silenceStartTime = 0
    this.speechCandidateStartTime = 0

    // Noise calibration
    this.noiseFloor = 0.01
    this.calibrationCount = 0

    // Visualizer smoothed level (0-100)
    this.currentLevel = 0

    // Event listeners
    this.listeners = new Map()
  }

  /**
   * Update configuration parameters dynamically
   * @param {Object} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
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
          console.error(`[VAD] Error in listener for ${event}:`, err)
        }
      }
    }
  }

  /**
   * Start analyzing the given MediaStream
   * @param {MediaStream} stream
   */
  start(stream) {
    if (!stream || !stream.active) {
      throw new Error('[VAD] Cannot start: provided MediaStream is invalid or inactive.')
    }

    this.stop()

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext
      if (!AudioCtxClass) {
        throw new Error('Web Audio API (AudioContext) is not supported in this browser.')
      }

      this.audioContext = new AudioCtxClass()

      // Handle suspended audio context (browser autoplay policies)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch((err) => {
          console.warn('[VAD] Failed to resume suspended AudioContext:', err)
        })
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(stream)
      this.analyserNode = this.audioContext.createAnalyser()
      this.analyserNode.fftSize = this.config.fftSize
      this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant

      this.sourceNode.connect(this.analyserNode)

      this.isAnalyzing = true
      this.isSpeaking = false
      this.speechStartTime = 0
      this.silenceStartTime = 0
      this.speechCandidateStartTime = 0
      this.calibrationCount = 0
      this.currentLevel = 0

      this._loop()
    } catch (error) {
      this.stop()
      throw error
    }
  }

  _loop = () => {
    if (!this.isAnalyzing || !this.analyserNode) return

    const timeData = new Uint8Array(this.analyserNode.fftSize)
    this.analyserNode.getByteTimeDomainData(timeData)

    // Compute RMS (Root Mean Square) amplitude
    let sum = 0
    for (let i = 0; i < timeData.length; i++) {
      // Convert 0..255 to -1.0..1.0
      const normalized = (timeData[i] - 128) / 128
      sum += normalized * normalized
    }
    const rms = Math.sqrt(sum / timeData.length)

    // Calculate normalized visualizer level (0 - 100)
    const rawLevel = Math.min(100, Math.round(rms * 400))
    this.currentLevel = Math.max(
      rawLevel,
      this.currentLevel * this.config.levelDecay
    )
    this.emit(VAD_EVENTS.AUDIO_LEVEL, Math.round(this.currentLevel))

    // Initial noise floor calibration
    if (this.calibrationCount < this.config.calibrationSamples) {
      this.noiseFloor = (this.noiseFloor * this.calibrationCount + rms) / (this.calibrationCount + 1)
      this.calibrationCount++
      this.animationFrameId = requestAnimationFrame(this._loop)
      return
    }

    // Dynamic threshold based on calibrated noise floor
    const effectiveSpeechThreshold = Math.max(
      this.config.speechThreshold,
      this.noiseFloor * 2.2
    )
    const effectiveSilenceThreshold = Math.max(
      this.config.silenceThreshold,
      this.noiseFloor * 1.4
    )

    const now = performance.now()
    const isAboveSpeechThreshold = rms >= effectiveSpeechThreshold
    const isBelowSilenceThreshold = rms <= effectiveSilenceThreshold

    if (!this.isSpeaking) {
      // Current state: SILENCE / LISTENING
      if (isAboveSpeechThreshold) {
        if (this.speechCandidateStartTime === 0) {
          this.speechCandidateStartTime = now
        } else if (now - this.speechCandidateStartTime >= this.config.speechStartDelayMs) {
          // Sustained energy confirmed -> SPEECH_START
          this.isSpeaking = true
          this.speechStartTime = now
          this.speechCandidateStartTime = 0
          this.silenceStartTime = 0
          this.emit(VAD_EVENTS.SPEECH_START, { timestamp: now, rms })
          this.emit(VAD_EVENTS.STATE_CHANGE, { isSpeaking: true })
        }
      } else {
        // Reset candidate timer if energy dips
        this.speechCandidateStartTime = 0
      }
    } else {
      // Current state: SPEAKING
      if (isBelowSilenceThreshold) {
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = now
        } else if (now - this.silenceStartTime >= this.config.silenceEndDelayMs) {
          const totalSpeechDuration = now - this.speechStartTime
          if (totalSpeechDuration >= this.config.minimumSpeechDurationMs) {
            // Sustained silence confirmed -> SPEECH_END
            this.isSpeaking = false
            this.silenceStartTime = 0
            this.speechCandidateStartTime = 0
            this.emit(VAD_EVENTS.SPEECH_END, {
              timestamp: now,
              durationMs: totalSpeechDuration
            })
            this.emit(VAD_EVENTS.STATE_CHANGE, { isSpeaking: false })
          } else {
            // Speech was too brief (e.g. click); reset back to silence
            this.isSpeaking = false
            this.silenceStartTime = 0
            this.speechCandidateStartTime = 0
            this.emit(VAD_EVENTS.STATE_CHANGE, { isSpeaking: false })
          }
        }
      } else {
        // Reset silence hold timer if user continues speaking
        this.silenceStartTime = 0
      }
    }

    this.animationFrameId = requestAnimationFrame(this._loop)
  }

  /**
   * Stop analysis loop and release Web Audio resources
   */
  stop() {
    this.isAnalyzing = false
    this.isSpeaking = false
    this.speechStartTime = 0
    this.silenceStartTime = 0
    this.speechCandidateStartTime = 0
    this.currentLevel = 0

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect()
      } catch (e) {
        // Ignore disconnect error during cleanup
      }
      this.sourceNode = null
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect()
      } catch (e) {
        // Ignore disconnect error during cleanup
      }
      this.analyserNode = null
    }

    if (this.audioContext) {
      try {
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(() => {})
        }
      } catch (e) {
        // Ignore close error during cleanup
      }
      this.audioContext = null
    }

    this.emit(VAD_EVENTS.AUDIO_LEVEL, 0)
    this.emit(VAD_EVENTS.STATE_CHANGE, { isSpeaking: false })
  }

  /**
   * Get current state
   */
  getIsSpeaking() {
    return this.isSpeaking
  }

  /**
   * Get smoothed visualizer audio level (0-100)
   */
  getAudioLevel() {
    return Math.round(this.currentLevel)
  }
}

export const voiceActivityDetector = new VoiceActivityDetector()
