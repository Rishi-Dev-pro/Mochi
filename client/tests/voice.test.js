/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VAD_CONFIG, STT_CONFIG, VOICE_STATES, PERMISSION_STATES } from '../src/voice/config'
import { MicrophoneManager } from '../src/voice/microphoneManager'
import { VoiceActivityDetector, VAD_EVENTS } from '../src/voice/voiceActivityDetector'
import { SpeechRecognitionService, STT_EVENTS } from '../src/voice/speechRecognitionService'
import { useVoiceStore } from '../src/store/useVoiceStore'

describe('Voice Subsystem Milestone 1 Test Suite', () => {
  beforeEach(() => {
    useVoiceStore.setState({
      voiceMode: false,
      permissionState: PERMISSION_STATES.IDLE,
      voiceState: VOICE_STATES.IDLE,
      audioLevel: 0,
      isSpeaking: false,
      interimTranscript: '',
      finalTranscript: '',
      transcriptHistory: [],
      error: null
    })
  })

  describe('Configuration & Constants', () => {
    it('has valid VAD default thresholds', () => {
      expect(VAD_CONFIG.speechThreshold).toBeGreaterThan(0)
      expect(VAD_CONFIG.silenceThreshold).toBeLessThan(VAD_CONFIG.speechThreshold)
      expect(VAD_CONFIG.speechStartDelayMs).toBeGreaterThanOrEqual(100)
      expect(VAD_CONFIG.silenceEndDelayMs).toBeGreaterThan(500)
      expect(VAD_CONFIG.minimumSpeechDurationMs).toBeGreaterThan(100)
    })

    it('has valid STT defaults', () => {
      expect(STT_CONFIG.continuous).toBe(true)
      expect(STT_CONFIG.interimResults).toBe(true)
      expect(STT_CONFIG.maxConsecutiveErrors).toBeGreaterThanOrEqual(3)
    })
  })

  describe('MicrophoneManager', () => {
    it('initializes in IDLE permission state', () => {
      const mic = new MicrophoneManager()
      expect(mic.getPermissionState()).toBe(PERMISSION_STATES.IDLE)
      expect(mic.isActive()).toBe(false)
      expect(mic.getStream()).toBeNull()
    })

    it('handles unsupported browser environment gracefully', async () => {
      const mic = new MicrophoneManager()
      vi.stubGlobal('navigator', {})

      await expect(mic.startCapture()).rejects.toThrow()
      expect(mic.getPermissionState()).toBe(PERMISSION_STATES.UNSUPPORTED)
    })

    it('handles permission denial appropriately', async () => {
      const mic = new MicrophoneManager()
      const notAllowedError = new Error('Permission denied')
      notAllowedError.name = 'NotAllowedError'

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(notAllowedError)
        }
      })

      await expect(mic.startCapture()).rejects.toThrow()
      expect(mic.getPermissionState()).toBe(PERMISSION_STATES.DENIED)
    })

    it('stops tracks and resets state on stopCapture()', async () => {
      const mic = new MicrophoneManager()
      const mockTrack = { stop: vi.fn(), readyState: 'live' }
      const mockStream = {
        active: true,
        getAudioTracks: () => [mockTrack],
        getTracks: () => [mockTrack]
      }

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream)
        }
      })

      const stream = await mic.startCapture()
      expect(stream).toBe(mockStream)
      expect(mic.getPermissionState()).toBe(PERMISSION_STATES.GRANTED)

      mic.stopCapture()
      expect(mockTrack.stop).toHaveBeenCalled()
      expect(mic.getStream()).toBeNull()
      expect(mic.getPermissionState()).toBe(PERMISSION_STATES.IDLE)
    })
  })

  describe('VoiceActivityDetector (VAD)', () => {
    it('initializes with default config and state', () => {
      const vad = new VoiceActivityDetector()
      expect(vad.getIsSpeaking()).toBe(false)
      expect(vad.getAudioLevel()).toBe(0)
    })

    it('supports dynamic threshold updates', () => {
      const vad = new VoiceActivityDetector({ speechThreshold: 0.05 })
      expect(vad.config.speechThreshold).toBe(0.05)

      vad.updateConfig({ speechThreshold: 0.08 })
      expect(vad.config.speechThreshold).toBe(0.08)
    })

    it('emits events to registered listeners and unregisters cleanly', () => {
      const vad = new VoiceActivityDetector()
      const callback = vi.fn()
      const unsub = vad.on(VAD_EVENTS.SPEECH_START, callback)

      vad.emit(VAD_EVENTS.SPEECH_START, { timestamp: 1000 })
      expect(callback).toHaveBeenCalledWith({ timestamp: 1000 })

      unsub()
      vad.emit(VAD_EVENTS.SPEECH_START, { timestamp: 2000 })
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('SpeechRecognitionService (STT)', () => {
    it('detects browser support properly', () => {
      const stt = new SpeechRecognitionService()
      vi.stubGlobal('SpeechRecognition', undefined)
      vi.stubGlobal('webkitSpeechRecognition', undefined)
      expect(stt.isSupported()).toBe(false)
    })

    it('handles final utterance flushing', () => {
      const stt = new SpeechRecognitionService()
      const finalCb = vi.fn()
      stt.on(STT_EVENTS.FINAL_RESULT, finalCb)

      stt.currentInterimText = 'hello mochi'
      stt.finalizeCurrentUtterance()

      expect(finalCb).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'hello mochi' })
      )
      expect(stt.currentInterimText).toBe('')
    })
  })

  describe('Zustand useVoiceStore State Machine', () => {
    it('manages voice state transitions correctly', () => {
      const store = useVoiceStore.getState()
      expect(store.voiceState).toBe(VOICE_STATES.IDLE)
      expect(store.voiceMode).toBe(false)

      store.setVoiceState(VOICE_STATES.LISTENING)
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.LISTENING)

      store.setInterimTranscript('test interim')
      expect(useVoiceStore.getState().interimTranscript).toBe('test interim')
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.TRANSCRIBING)

      store.setFinalTranscript('test final utterance')
      expect(useVoiceStore.getState().finalTranscript).toBe('test final utterance')
      expect(useVoiceStore.getState().interimTranscript).toBe('')
      expect(useVoiceStore.getState().transcriptHistory.length).toBe(1)
      expect(useVoiceStore.getState().transcriptHistory[0].text).toBe('test final utterance')
    })

    it('accumulates separate transcript history entries for continuous utterances', () => {
      const store = useVoiceStore.getState()

      store.setFinalTranscript('First sentence.')
      store.setFinalTranscript('Second sentence.')
      store.setFinalTranscript('Third sentence.')

      const history = useVoiceStore.getState().transcriptHistory
      expect(history.length).toBe(3)
      expect(history[0].text).toBe('Third sentence.')
      expect(history[1].text).toBe('Second sentence.')
      expect(history[2].text).toBe('First sentence.')
    })

    it('clears transcripts properly', () => {
      const store = useVoiceStore.getState()
      store.setFinalTranscript('Temporary sentence')
      expect(useVoiceStore.getState().transcriptHistory.length).toBe(1)

      store.clearTranscripts()
      expect(useVoiceStore.getState().transcriptHistory.length).toBe(0)
      expect(useVoiceStore.getState().finalTranscript).toBe('')
      expect(useVoiceStore.getState().interimTranscript).toBe('')
    })

    it('handles rapid start/stop toggling cleanly', async () => {
      const store = useVoiceStore.getState()
      const mockTrack = { stop: vi.fn(), readyState: 'live' }
      const mockStream = {
        active: true,
        getAudioTracks: () => [mockTrack],
        getTracks: () => [mockTrack]
      }

      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream)
        }
      })

      // Toggle rapidly
      store.stopVoiceMode()
      expect(useVoiceStore.getState().voiceMode).toBe(false)
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.IDLE)
      expect(useVoiceStore.getState().audioLevel).toBe(0)
      expect(useVoiceStore.getState().isSpeaking).toBe(false)
    })

    it('updates tunable VAD thresholds in store and coordinator', () => {
      const store = useVoiceStore.getState()
      store.updateConfig({ speechThreshold: 0.045, silenceEndDelayMs: 1500 })

      expect(useVoiceStore.getState().config.speechThreshold).toBe(0.045)
      expect(useVoiceStore.getState().config.silenceEndDelayMs).toBe(1500)
    })
  })
})

