/**
 * Web Audio Engine & Real-Time Amplitude Analyzer
 *
 * Manages AudioContext lifecycle, real AudioBufferSourceNode playback,
 * AnalyserNode (FFT & Time-Domain), GainNode (Volume), and true physical RMS audio energy calculation (0.0 - 1.0).
 *
 * The AnalyserNode receives the EXACT SAME physical speech waveform sent to the speakers.
 * Zero synthetic oscillators. Zero artificial boundary simulations.
 */

import { TTS_CONFIG } from './config'

export const AUDIO_ENGINE_EVENTS = {
  AMPLITUDE: 'amplitude',
  STATE_CHANGE: 'state_change',
  ENDED: 'ended'
}

export class AudioEngine {
  constructor(config = {}) {
    this.config = { ...TTS_CONFIG, ...config }

    this.audioContext = null
    this.analyserNode = null
    this.gainNode = null
    this.currentSource = null
    this.animationFrameId = null

    this.isPlaying = false
    this.currentAmplitude = 0.0
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
   *
   * Audio Pipeline:
   * [AudioBufferSourceNode] ──► [AnalyserNode] ──► [GainNode] ──► [AudioContext.destination (Speakers)]
   */
  setupAudioPipeline() {
    const ctx = this.getOrCreateContext()
    if (!ctx) return null

    if (!this.gainNode) {
      this.gainNode = ctx.createGain()
      this.gainNode.gain.value = Math.max(0, Math.min(1, this.config.volume))
      this.gainNode.connect(ctx.destination)
    }

    if (!this.analyserNode) {
      this.analyserNode = ctx.createAnalyser()
      this.analyserNode.fftSize = this.config.fftSize || 512
      this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant !== undefined ? this.config.smoothingTimeConstant : 0.8
      this.analyserNode.connect(this.gainNode)
    }

    return ctx
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
   * Play genuine decoded audio buffer through Web Audio graph and AnalyserNode
   * @param {AudioBuffer} audioBuffer
   * @returns {Promise<void>}
   */
  async playAudioBuffer(audioBuffer) {
    if (!audioBuffer) {
      throw new Error('AudioBuffer is required for playback')
    }

    // Stop any existing playback before starting new
    this.stop()

    const ctx = this.setupAudioPipeline()
    if (!ctx) {
      throw new Error('Web Audio AudioContext is unavailable')
    }

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch (err) {
        console.warn('[AudioEngine] AudioContext resume error:', err)
      }
    }

    return new Promise((resolve) => {
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.analyserNode)

      this.currentSource = source
      this.isPlaying = true
      this.currentAmplitude = 0.0

      source.onended = () => {
        if (this.currentSource === source) {
          this.isPlaying = false
          this.currentSource = null
          this._stopAnalysisLoop()
          this.currentAmplitude = 0.0
          this.emit(AUDIO_ENGINE_EVENTS.AMPLITUDE, 0.0)
          this.emit(AUDIO_ENGINE_EVENTS.STATE_CHANGE, { isPlaying: false })
          this.emit(AUDIO_ENGINE_EVENTS.ENDED)
          resolve()
        }
      }

      source.start(0)
      this._startAnalysisLoop()
      this.emit(AUDIO_ENGINE_EVENTS.STATE_CHANGE, { isPlaying: true })
    })
  }

  /**
   * Start animation frame loop for true physical RMS calculation
   */
  _startAnalysisLoop() {
    this._stopAnalysisLoop()
    this._analysisLoop()
  }

  _stopAnalysisLoop() {
    if (this.animationFrameId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId)
      }
      this.animationFrameId = null
    }
  }

  /**
   * Continuous analysis loop reading ACTUAL float samples from AnalyserNode
   */
  _analysisLoop() {
    if (!this.isPlaying) return

    let rawRms = 0.0

    if (this.analyserNode) {
      const timeData = new Float32Array(this.analyserNode.fftSize)
      this.analyserNode.getFloatTimeDomainData(timeData)

      // Calculate true Root Mean Square (RMS) of acoustic waveform
      let sum = 0
      for (let i = 0; i < timeData.length; i++) {
        const val = timeData[i]
        sum += val * val
      }
      rawRms = Math.sqrt(sum / timeData.length)
    }

    // Dynamic scale normalization: typical conversational speech RMS ~ 0.05 to 0.35
    const scaled = Math.min(1.0, rawRms * 3.8)

    // Apply exponential smoothing: smoothed = current + alpha * (target - current)
    const alpha = 1.0 - (this.config.amplitudeSmoothing !== undefined ? this.config.amplitudeSmoothing : 0.65)
    this.currentAmplitude = this.currentAmplitude + alpha * (scaled - this.currentAmplitude)

    // Clamp strictly within 0.0 and 1.0
    const normalizedAmplitude = Math.max(0.0, Math.min(1.0, this.currentAmplitude))

    // Emit real amplitude update (floating point 0.0 to 1.0)
    this.emit(AUDIO_ENGINE_EVENTS.AMPLITUDE, normalizedAmplitude)

    this.animationFrameId = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame(() => this._analysisLoop())
      : null
  }

  /**
   * Retrieve raw frequency bins from AnalyserNode for future spectral / viseme analysis
   * @returns {Uint8Array|null}
   */
  getFrequencyData() {
    if (!this.analyserNode) return null
    const freqData = new Uint8Array(this.analyserNode.frequencyBinCount)
    this.analyserNode.getByteFrequencyData(freqData)
    return freqData
  }

  /**
   * Stop audio playback immediately, disconnect source, cancel loop, and reset amplitude to 0.0
   */
  stop() {
    this.isPlaying = false
    this.currentAmplitude = 0.0
    this._stopAnalysisLoop()

    if (this.currentSource) {
      try {
        this.currentSource.stop()
        this.currentSource.disconnect()
      } catch (e) {}
      this.currentSource = null
    }

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
