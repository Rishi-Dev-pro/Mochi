/**
 * Voice Coordinator
 *
 * Orchestrates Microphone Manager, VAD, and Speech Recognition in sync.
 * Serves as the central bridge between low-level Web APIs and the Zustand Voice Store.
 */

import { microphoneManager } from './microphoneManager'
import { voiceActivityDetector, VAD_EVENTS } from './voiceActivityDetector'
import { speechRecognitionService, STT_EVENTS } from './speechRecognitionService'
import { VOICE_STATES, PERMISSION_STATES } from './config'

export class VoiceCoordinator {
  constructor() {
    this.isActive = false
    this.storeApi = null
    this.unsubscribers = []
    this.lastAudioLevelUpdate = 0
  }

  /**
   * Inject or bind the Zustand store API lazily to prevent circular imports
   */
  setStoreApi(storeApi) {
    this.storeApi = storeApi
  }

  _getStore() {
    if (this.storeApi) return this.storeApi
    // Fallback dynamic require/import cache if store is global
    try {
      const { useVoiceStore } = require('../store/useVoiceStore')
      return useVoiceStore.getState()
    } catch {
      return null
    }
  }

  _updateStore(fn) {
    if (this.storeApi) {
      fn(this.storeApi)
    }
  }

  /**
   * Update configuration across all sub-modules
   * @param {Object} config
   */
  updateConfig(config) {
    voiceActivityDetector.updateConfig(config)
    speechRecognitionService.config = { ...speechRecognitionService.config, ...config }
  }

  /**
   * Initialize coordinator and bind event channels
   */
  _bindEvents() {
    this._unbindEvents()

    // 1. Microphone Manager Events
    const unsubMic = microphoneManager.subscribe((micState) => {
      this._updateStore((store) => {
        store.setPermissionState(micState.permissionState)
      })
    })
    this.unsubscribers.push(unsubMic)

    // 2. VAD Events
    const unsubVadLevel = voiceActivityDetector.on(VAD_EVENTS.AUDIO_LEVEL, (level) => {
      const now = performance.now()
      // Throttle store updates to ~30fps to avoid React render churn while keeping smooth UI visualizer
      if (now - this.lastAudioLevelUpdate >= 32) {
        this.lastAudioLevelUpdate = now
        this._updateStore((store) => {
          store.setAudioLevel(level)
        })
      }
    })
    this.unsubscribers.push(unsubVadLevel)

    const unsubVadStart = voiceActivityDetector.on(VAD_EVENTS.SPEECH_START, () => {
      this._updateStore((store) => {
        // Self-Hearing Protection Gate: Ignore VAD triggers while Mochi is speaking or processing
        if (store.isMochiSpeaking || store.voiceState === VOICE_STATES.MOCHI_SPEAKING || store.voiceState === VOICE_STATES.PROCESSING) {
          return
        }

        store.setIsSpeaking(true)
        if (store.voiceState === VOICE_STATES.LISTENING) {
          store.setVoiceState(VOICE_STATES.USER_SPEAKING)
        }
      })
    })
    this.unsubscribers.push(unsubVadStart)

    const unsubVadEnd = voiceActivityDetector.on(VAD_EVENTS.SPEECH_END, () => {
      this._updateStore((store) => {
        // Self-Hearing Protection Gate: Ignore VAD triggers while Mochi is speaking or processing
        if (store.isMochiSpeaking || store.voiceState === VOICE_STATES.MOCHI_SPEAKING || store.voiceState === VOICE_STATES.PROCESSING) {
          return
        }

        // VAD indicates silence threshold reached; signal STT to finalize current phrase
        speechRecognitionService.finalizeCurrentUtterance()
        store.setIsSpeaking(false)
      })
    })
    this.unsubscribers.push(unsubVadEnd)

    // 3. STT Events
    const unsubSttInterim = speechRecognitionService.on(STT_EVENTS.INTERIM_RESULT, (data) => {
      this._updateStore((store) => {
        // Self-Hearing Protection Gate: Discard interim transcripts while Mochi is speaking
        if (store.isMochiSpeaking || store.voiceState === VOICE_STATES.MOCHI_SPEAKING || store.voiceState === VOICE_STATES.PROCESSING) {
          return
        }
        store.setInterimTranscript(data.text)
      })
    })
    this.unsubscribers.push(unsubSttInterim)

    const unsubSttFinal = speechRecognitionService.on(STT_EVENTS.FINAL_RESULT, (data) => {
      this._updateStore((store) => {
        // Self-Hearing Protection Gate: Discard final transcripts while Mochi is speaking
        if (store.isMochiSpeaking || store.voiceState === VOICE_STATES.MOCHI_SPEAKING || store.voiceState === VOICE_STATES.PROCESSING) {
          return
        }
        store.setFinalTranscript(data.text)
      })
    })
    this.unsubscribers.push(unsubSttFinal)


    const unsubSttError = speechRecognitionService.on(STT_EVENTS.ERROR, (err) => {
      this._updateStore((store) => {
        if (err.error === 'not-allowed') {
          store.setPermissionState(PERMISSION_STATES.DENIED)
          store.setVoiceState(VOICE_STATES.ERROR)
        }
      })
    })
    this.unsubscribers.push(unsubSttError)
  }

  _unbindEvents() {
    for (const unsub of this.unsubscribers) {
      try {
        unsub()
      } catch (err) {
        console.warn('[VoiceCoordinator] Error unbinding event:', err)
      }
    }
    this.unsubscribers = []
  }

  /**
   * Start the complete hands-free voice capture pipeline
   */
  async start() {
    if (this.isActive) return

    this._bindEvents()

    try {
      // Step 1: Acquire microphone stream
      const stream = await microphoneManager.startCapture()

      // Step 2: Initialize Web Audio VAD
      voiceActivityDetector.start(stream)

      // Step 3: Initialize Web Speech API STT
      speechRecognitionService.start()

      this.isActive = true

      this._updateStore((store) => {
        store.setPermissionState(PERMISSION_STATES.GRANTED)
        store.setVoiceState(VOICE_STATES.LISTENING)
      })
    } catch (error) {
      this.stop()
      throw error
    }
  }

  /**
   * Ensure voice recognition is actively listening for subsequent turns
   */
  ensureListening() {
    if (this.isActive) {
      speechRecognitionService.ensureListening()
    }
  }

  /**
   * Stop the complete hands-free voice capture pipeline and release all resources
   */
  stop() {
    this.isActive = false

    try {
      speechRecognitionService.stop()
    } catch (e) {
      console.warn('[VoiceCoordinator] Error stopping STT:', e)
    }

    try {
      voiceActivityDetector.stop()
    } catch (e) {
      console.warn('[VoiceCoordinator] Error stopping VAD:', e)
    }

    try {
      microphoneManager.stopCapture()
    } catch (e) {
      console.warn('[VoiceCoordinator] Error stopping microphone capture:', e)
    }

    this._unbindEvents()
  }
}

export const voiceCoordinator = new VoiceCoordinator()
