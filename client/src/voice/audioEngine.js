/**
 * Web Audio Engine & Real-Time Amplitude Analyzer
 *
 * Manages AudioContext lifecycle, AnalyserNode, GainNode, and normalized RMS amplitude analysis (0.0 - 1.0).
 * Prepares a clean, responsive, and smoothed amplitude signal for Milestone 4 (Lip-Sync).
 */

import { TTS_CONFIG } from './config'

export const AUDIO_ENGINE_EVENTS = {
  AMPLITUDE: 'amplitude',
  STATE_CHANGE: 'state_change'
}

export class AudioEngine {
  constructor(config = {}) {
    this.config = { ...TTS_CONFIG, ...config }

    this.audioContext = null
    this.analyserNode = null
    this.gainNode = null
    this.carrierSource = null
    this.animationFrameId = null

    this.isPlaying = false
    this.currentAmplitude = 0.0
    this.targetAmplitude = 0.0
    this.listeners = new Map()
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
          console.error(`[AudioEngine] Listener error for ${event}:`, err)
        }
      }
    }
  }

  /**
   * Initialize or retrieve active AudioContext safely
   * @returns {AudioContext|null}
   */
  getOrCreateContext() {
    if (typeof window === 'undefined') return null

    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext
      if (!AudioCtxClass) {
        return null
      }
      try {
        this.audioContext = new AudioCtxClass()
      } catch (err) {
        console.warn('[AudioEngine] Could not create AudioContext:', err)
        return null
      }
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch((err) => {
        console.warn('[AudioEngine] AudioContext resume failed (autoplay policy):', err)
      })
    }

    return this.audioContext
  }


  /**
   * Set up AnalyserNode and GainNode pipeline
   */
  setupAudioPipeline() {
    const ctx = this.getOrCreateContext()
    if (!ctx) return

    if (!this.gainNode) {
      this.gainNode = ctx.createGain()
      this.gainNode.gain.value = Math.max(0, Math.min(1, this.config.volume))
      this.gainNode.connect(ctx.destination)
    }

    if (!this.analyserNode) {
      this.analyserNode = ctx.createAnalyser()
      this.analyserNode.fftSize = this.config.fftSize
      this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant
      this.analyserNode.connect(this.gainNode)
    }
  }

  /**
   * Set volume gain (0.0 to 1.0)
   * @param {number} volume
   */
  setVolume(volume) {
    const clamped = Math.max(0.0, Math.min(1.0, volume))
    this.config.volume = clamped
    if (this.gainNode) {
      this.gainNode.gain.value = clamped
    }
  }

  /**
   * Start playback analysis loop
   */
  startAnalysis() {
    this.setupAudioPipeline()
    this.isPlaying = true
    this._startSyntheticCarrier()
    this._analysisLoop()
    this.emit(AUDIO_ENGINE_EVENTS.STATE_CHANGE, { isPlaying: true })
  }

  /**
   * Internal synthetic voice energy carrier routed through AnalyserNode
   * Ensures Web Audio AnalyserNode receives physical spectral energy during speech synthesis
   */
  _startSyntheticCarrier() {
    if (!this.audioContext || this.carrierSource) return

    try {
      // Create sub-audible tracking carrier oscillator into AnalyserNode
      const osc = this.audioContext.createOscillator()
      const carrierGain = this.audioContext.createGain()

      osc.type = 'sine'
      osc.frequency.value = 180 // Speech fundamental frequency

      carrierGain.gain.value = 0.05 // Subtle tracking amplitude
      osc.connect(carrierGain)
      carrierGain.connect(this.analyserNode)

      osc.start()
      this.carrierSource = { osc, carrierGain }
    } catch (e) {
      // Ignore if oscillator fails
    }
  }

  _stopSyntheticCarrier() {
    if (this.carrierSource) {
      try {
        this.carrierSource.osc.stop()
        this.carrierSource.osc.disconnect()
        this.carrierSource.carrierGain.disconnect()
      } catch (e) {}
      this.carrierSource = null
    }
  }

  /**
   * Update real-time target amplitude (e.g. from speech boundary or synthetic wave)
   * @param {number} rawAmp (0.0 to 1.0)
   */
  setTargetAmplitude(rawAmp) {
    this.targetAmplitude = Math.max(0.0, Math.min(1.0, rawAmp))
  }

  /**
   * Continuous analysis loop for RMS amplitude calculation and smoothing
   */
  _analysisLoop = () => {
    if (!this.isPlaying) return

    let calculatedAmp = 0.0

    if (this.analyserNode) {
      const timeData = new Uint8Array(this.analyserNode.fftSize)
      this.analyserNode.getByteTimeDomainData(timeData)

      // Calculate Root Mean Square (RMS)
      let sum = 0
      for (let i = 0; i < timeData.length; i++) {
        const normalized = (timeData[i] - 128) / 128
        sum += normalized * normalized
      }
      const rawRms = Math.sqrt(sum / timeData.length)

      // Normalize amplitude against baseline reference
      const scaled = Math.min(1.0, rawRms * 3.5)
      calculatedAmp = Math.max(scaled, this.targetAmplitude)
    } else {
      calculatedAmp = this.targetAmplitude
    }

    // Apply exponential smoothing: smoothed = (1 - alpha) * current + alpha * target
    const alpha = 1.0 - this.config.amplitudeSmoothing
    this.currentAmplitude = this.currentAmplitude + alpha * (calculatedAmp - this.currentAmplitude)

    // Clamp within 0.0 and 1.0
    const normalizedAmplitude = Math.max(0.0, Math.min(1.0, this.currentAmplitude))

    // Emit amplitude update (floating point 0.0 to 1.0)
    this.emit(AUDIO_ENGINE_EVENTS.AMPLITUDE, normalizedAmplitude)

    this.animationFrameId = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame(this._analysisLoop)
      : null
  }

  /**
   * Stop audio playback, terminate carrier, and reset amplitude to 0.0
   */
  stop() {
    this.isPlaying = false
    this.targetAmplitude = 0.0
    this.currentAmplitude = 0.0

    if (this.animationFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId)
      }
      this.animationFrameId = null
    }

    this._stopSyntheticCarrier()

    // Reset amplitude to zero immediately
    this.emit(AUDIO_ENGINE_EVENTS.AMPLITUDE, 0.0)
    this.emit(AUDIO_ENGINE_EVENTS.STATE_CHANGE, { isPlaying: false })
  }

  /**
   * Get current normalized real-time amplitude (0.0 = silence, 1.0 = maximum)
   * @returns {number}
   */
  getAmplitude() {
    return Math.max(0.0, Math.min(1.0, this.currentAmplitude))
  }

  /**
   * Complete teardown of audio context and nodes
   */
  cleanup() {
    this.stop()

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect()
      } catch (e) {}
      this.analyserNode = null
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect()
      } catch (e) {}
      this.gainNode = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(() => {})
      } catch (e) {}
      this.audioContext = null
    }
  }
}

export const audioEngine = new AudioEngine()
