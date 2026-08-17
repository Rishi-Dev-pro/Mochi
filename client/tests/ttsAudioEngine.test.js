/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AudioEngine, AUDIO_ENGINE_EVENTS } from '../src/voice/audioEngine'
import { TtsService } from '../src/voice/ttsService'
import { TTS_STATES } from '../src/voice/config'
import { useVoiceStore } from '../src/store/useVoiceStore'

describe('Web Audio Real-Audio TTS & Amplitude Analysis Suite (Milestone 3)', () => {
  beforeEach(() => {
    useVoiceStore.setState({
      voiceMode: false,
      ttsState: TTS_STATES.IDLE,
      isMochiSpeaking: false,
      outputAudioLevel: 0.0,
      ttsVolume: 1.0
    })
  })

  describe('AudioEngine Web Audio & Real RMS Amplitude Analyzer', () => {
    it('initializes with default config and zero amplitude', () => {
      const engine = new AudioEngine()
      expect(engine.getAmplitude()).toBe(0.0)
      expect(engine.isPlaying).toBe(false)
    })

    it('clamps volume within [0.0, 1.0]', () => {
      const engine = new AudioEngine()
      engine.setVolume(1.5)
      expect(engine.config.volume).toBe(1.0)

      engine.setVolume(-0.5)
      expect(engine.config.volume).toBe(0.0)

      engine.setVolume(0.75)
      expect(engine.config.volume).toBe(0.75)
    })

    it('calculates true RMS from Float32Array time-domain audio samples', () => {
      const engine = new AudioEngine({ amplitudeSmoothing: 0.0 }) // zero smoothing for raw calculation
      const listener = vi.fn()
      engine.on(AUDIO_ENGINE_EVENTS.AMPLITUDE, listener)

      // Mock AnalyserNode with genuine sine wave float samples
      const mockSamples = new Float32Array(512)
      for (let i = 0; i < mockSamples.length; i++) {
        mockSamples[i] = Math.sin((i * 2 * Math.PI) / 32) * 0.5
      }

      engine.analyserNode = {
        fftSize: 512,
        getFloatTimeDomainData: (arr) => arr.set(mockSamples)
      }

      engine.isPlaying = true
      engine._analysisLoop()

      const amp = engine.getAmplitude()
      expect(amp).toBeGreaterThan(0.0)
      expect(amp).toBeLessThanOrEqual(1.0)
      expect(listener).toHaveBeenCalledWith(expect.any(Number))
    })

    it('returns 0.0 amplitude when samples are silent (disconnect / silence test)', () => {
      const engine = new AudioEngine({ amplitudeSmoothing: 0.0 })

      // Mock silent AnalyserNode (all zeros)
      engine.analyserNode = {
        fftSize: 512,
        getFloatTimeDomainData: (arr) => arr.fill(0)
      }

      engine.isPlaying = true
      engine._analysisLoop()

      expect(engine.getAmplitude()).toBe(0.0)
    })

    it('smooths rapid amplitude spikes gracefully with EMA', () => {
      const engine = new AudioEngine({ amplitudeSmoothing: 0.8 })
      const loudSamples = new Float32Array(512).fill(0.8)

      engine.analyserNode = {
        fftSize: 512,
        getFloatTimeDomainData: (arr) => arr.set(loudSamples)
      }

      engine.isPlaying = true
      engine._analysisLoop()
      const step1 = engine.getAmplitude()

      // First step smoothed
      expect(step1).toBeGreaterThan(0.0)
      expect(step1).toBeLessThan(1.0)

      engine._analysisLoop()
      const step2 = engine.getAmplitude()
      expect(step2).toBeGreaterThan(step1)
    })

    it('resets amplitude to 0.0 immediately on stop()', () => {
      const engine = new AudioEngine()
      const listener = vi.fn()
      engine.on(AUDIO_ENGINE_EVENTS.AMPLITUDE, listener)

      engine.isPlaying = true
      engine.currentAmplitude = 0.85
      engine.stop()

      expect(engine.isPlaying).toBe(false)
      expect(engine.getAmplitude()).toBe(0.0)
      expect(listener).toHaveBeenCalledWith(0.0)
    })
  })

  describe('TtsService Speech Synthesis', () => {
    it('rejects empty or whitespace text', async () => {
      const tts = new TtsService()
      expect(await tts.speak('')).toBe(false)
      expect(await tts.speak('   ')).toBe(false)
      expect(await tts.speak(null)).toBe(false)
      expect(tts.getState()).toBe(TTS_STATES.IDLE)
    })

    it('handles unsupported environment safely without crashing', async () => {
      const tts = new TtsService()
      vi.stubGlobal('AudioContext', undefined)
      vi.stubGlobal('webkitAudioContext', undefined)

      const result = await tts.speak('Hello Mochi!')
      expect(result).toBe(false)
      expect(tts.getState()).toBe(TTS_STATES.ERROR)
    })

    it('interrupts previous speech when a new utterance is requested', async () => {
      const tts = new TtsService()
      tts.state = TTS_STATES.SPEAKING

      tts.stop()
      expect(tts.getState()).toBe(TTS_STATES.IDLE)
      expect(tts.isSpeaking()).toBe(false)
    })
  })

  describe('Zustand useVoiceStore TTS Integration', () => {
    it('manages TTS states and output amplitude properly', () => {
      const store = useVoiceStore.getState()
      expect(store.ttsState).toBe(TTS_STATES.IDLE)
      expect(store.isMochiSpeaking).toBe(false)
      expect(store.outputAudioLevel).toBe(0.0)

      store.setTtsState(TTS_STATES.SPEAKING)
      expect(useVoiceStore.getState().ttsState).toBe(TTS_STATES.SPEAKING)
      expect(useVoiceStore.getState().isMochiSpeaking).toBe(true)

      store.setOutputAudioLevel(0.72)
      expect(useVoiceStore.getState().outputAudioLevel).toBe(0.72)

      store.stopTts()
      expect(useVoiceStore.getState().ttsState).toBe(TTS_STATES.IDLE)
      expect(useVoiceStore.getState().isMochiSpeaking).toBe(false)
      expect(useVoiceStore.getState().outputAudioLevel).toBe(0.0)
    })
  })
})
