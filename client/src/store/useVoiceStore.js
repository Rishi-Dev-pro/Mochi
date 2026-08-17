/**
 * Zustand Voice Store
 *
 * Centralized state machine and observable store for the hands-free voice subsystem.
 */

import { create } from 'zustand'
import { VOICE_STATES, PERMISSION_STATES, TTS_STATES, VAD_CONFIG, STT_CONFIG, TTS_CONFIG } from '../voice/config'
import { voiceCoordinator } from '../voice/voiceCoordinator'
import { ttsService, TTS_EVENTS } from '../voice/ttsService'
import { audioEngine, AUDIO_ENGINE_EVENTS } from '../voice/audioEngine'

export const useVoiceStore = create((set, get) => ({
  // Active voice mode flag
  voiceMode: false,

  // Device & API permission state
  permissionState: PERMISSION_STATES.IDLE,

  // Explicit state machine
  voiceState: VOICE_STATES.IDLE,

  // Real-time audio energy level (0-100) for input visual meters
  audioLevel: 0,

  // True if VAD currently detects speech
  isSpeaking: false,

  // ============ TTS SPEECH SYNTHESIS STATE ============
  ttsState: TTS_STATES.IDLE,
  isMochiSpeaking: false,
  outputAudioLevel: 0.0, // Real-time 0.0 - 1.0 normalized amplitude for M4 lip-sync
  ttsVolume: 1.0,

  // Live streaming interim transcript
  interimTranscript: '',

  // Most recent completed utterance transcript
  finalTranscript: '',

  // Array of historic completed utterances [{ id, text, timestamp }]
  transcriptHistory: [],

  // Error message if any
  error: null,

  // Tunable configuration
  config: {
    ...VAD_CONFIG,
    ...STT_CONFIG,
    ...TTS_CONFIG
  },

  // Set explicit voice state
  setVoiceState: (voiceState) => set({ voiceState }),

  // Set permission state
  setPermissionState: (permissionState) => set({ permissionState }),

  // Set real-time visualizer audio level
  setAudioLevel: (audioLevel) => set({ audioLevel }),

  // Set speaking status
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),

  // Set TTS state
  setTtsState: (ttsState) => {
    const isSpeaking = ttsState === TTS_STATES.SPEAKING
    const isFinished = ttsState === TTS_STATES.COMPLETED || ttsState === TTS_STATES.IDLE
    const currentVoiceMode = get().voiceMode

    set((state) => ({
      ttsState,
      isMochiSpeaking: isSpeaking,
      voiceState: isSpeaking
        ? VOICE_STATES.MOCHI_SPEAKING
        : (isFinished && currentVoiceMode && (state.voiceState === VOICE_STATES.MOCHI_SPEAKING || state.voiceState === VOICE_STATES.PROCESSING)
            ? VOICE_STATES.LISTENING
            : state.voiceState)
    }))
  },

  setIsMochiSpeaking: (isMochiSpeaking) => set({ isMochiSpeaking }),

  setOutputAudioLevel: (outputAudioLevel) => set({ outputAudioLevel }),

  setTtsVolume: (volume) => {
    audioEngine.setVolume(volume)
    set({ ttsVolume: volume })
  },

  stopTts: () => {
    ttsService.stop()
    const currentVoiceMode = get().voiceMode
    set({
      ttsState: TTS_STATES.IDLE,
      isMochiSpeaking: false,
      outputAudioLevel: 0.0,
      voiceState: currentVoiceMode ? VOICE_STATES.LISTENING : VOICE_STATES.IDLE
    })
  },

  // Set live interim transcript
  setInterimTranscript: (interimTranscript) => {
    set((state) => ({
      interimTranscript,
      voiceState: interimTranscript && state.voiceState === VOICE_STATES.LISTENING
        ? VOICE_STATES.USER_SPEAKING
        : state.voiceState
    }))
  },

  // Set final completed utterance
  setFinalTranscript: (text) => {
    const trimmed = text?.trim()
    if (!trimmed) return

    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      text: trimmed,
      timestamp: Date.now()
    }

    set((state) => ({
      finalTranscript: trimmed,
      interimTranscript: '',
      transcriptHistory: [newEntry, ...state.transcriptHistory].slice(0, 50)
    }))
  },


  // Clear all historic and current transcripts
  clearTranscripts: () => set({ interimTranscript: '', finalTranscript: '', transcriptHistory: [] }),

  // Reset error
  resetError: () => set({ error: null }),

  // Update configuration parameters
  updateConfig: (newConfig) => {
    const updated = { ...get().config, ...newConfig }
    voiceCoordinator.updateConfig(updated)
    if (newConfig.volume !== undefined) {
      audioEngine.setVolume(newConfig.volume)
    }
    set({ config: updated })
  },

  // Start voice mode
  startVoiceMode: async () => {
    if (get().voiceMode) return

    set({
      voiceMode: true,
      error: null,
      voiceState: VOICE_STATES.REQUESTING_PERMISSION,
      permissionState: PERMISSION_STATES.REQUESTING
    })

    try {
      await voiceCoordinator.start()
    } catch (err) {
      console.error('[VoiceStore] Failed to start voice mode:', err)
      set({
        voiceMode: false,
        voiceState: VOICE_STATES.ERROR,
        error: err.message || 'Failed to start voice mode'
      })
    }
  },

  // Stop voice mode
  stopVoiceMode: () => {
    set({
      voiceMode: false,
      voiceState: VOICE_STATES.STOPPING,
      audioLevel: 0,
      isSpeaking: false,
      interimTranscript: ''
    })

    voiceCoordinator.stop()
    ttsService.stop()

    set({
      voiceState: VOICE_STATES.IDLE,
      permissionState: PERMISSION_STATES.IDLE,
      isMochiSpeaking: false,
      outputAudioLevel: 0.0
    })
  },

  // Toggle voice mode on/off
  toggleVoiceMode: async () => {
    if (get().voiceMode) {
      get().stopVoiceMode()
    } else {
      await get().startVoiceMode()
    }
  }
}))

// Connect store API to coordinator
voiceCoordinator.setStoreApi({
  setPermissionState: (state) => useVoiceStore.getState().setPermissionState(state),
  setVoiceState: (state) => useVoiceStore.getState().setVoiceState(state),
  setAudioLevel: (level) => useVoiceStore.getState().setAudioLevel(level),
  setIsSpeaking: (isSpeaking) => useVoiceStore.getState().setIsSpeaking(isSpeaking),
  setInterimTranscript: (text) => useVoiceStore.getState().setInterimTranscript(text),
  setFinalTranscript: (text) => useVoiceStore.getState().setFinalTranscript(text),
  get voiceState() {
    return useVoiceStore.getState().voiceState
  }
})

// Subscribe TTS state and audio amplitude to VoiceStore
let lastOutputLevelUpdate = 0
ttsService.on(TTS_EVENTS.STATE_CHANGE, ({ state }) => {
  useVoiceStore.getState().setTtsState(state)
})

audioEngine.on(AUDIO_ENGINE_EVENTS.AMPLITUDE, (amp) => {
  const now = performance.now()
  // Throttle store update to ~30fps for smooth UI rendering while maintaining reactive signal
  if (now - lastOutputLevelUpdate >= 32 || amp === 0.0) {
    lastOutputLevelUpdate = now
    useVoiceStore.getState().setOutputAudioLevel(amp)
  }
})


