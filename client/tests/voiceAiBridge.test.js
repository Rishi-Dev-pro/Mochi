/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VoiceAiBridge } from '../src/voice/voiceAiBridge'
import { parseEmotionFromResponse } from '../src/services/llmService'
import { useVoiceStore } from '../src/store/useVoiceStore'
import { VOICE_STATES, PERMISSION_STATES } from '../src/voice/config'

describe('Voice-to-AI Bridge & Emotion Extraction Suite (Milestone 2)', () => {
  beforeEach(() => {
    useVoiceStore.setState({
      voiceMode: true,
      permissionState: PERMISSION_STATES.GRANTED,
      voiceState: VOICE_STATES.LISTENING,
      audioLevel: 0,
      isSpeaking: false,
      interimTranscript: '',
      finalTranscript: '',
      transcriptHistory: [],
      error: null
    })
  })

  describe('VoiceAiBridge Deduplication & Processing', () => {
    it('dispatches valid non-empty transcripts to the AI handler', async () => {
      const bridge = new VoiceAiBridge()
      const mockSend = vi.fn().mockResolvedValue({ id: 'resp-1', content: 'Hello!' })
      bridge.registerSendHandler(mockSend)

      const result = await bridge.processUtterance('Hello Mochi', 'utterance-1')
      expect(result).toBe(true)
      expect(mockSend).toHaveBeenCalledWith('Hello Mochi', expect.any(String))
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('filters out empty or whitespace transcripts', async () => {
      const bridge = new VoiceAiBridge()
      const mockSend = vi.fn().mockResolvedValue({})
      bridge.registerSendHandler(mockSend)

      expect(await bridge.processUtterance('')).toBe(false)
      expect(await bridge.processUtterance('   ')).toBe(false)
      expect(await bridge.processUtterance(null)).toBe(false)
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('prevents duplicate utterance submissions with the same utterance ID', async () => {
      const bridge = new VoiceAiBridge()
      const mockSend = vi.fn().mockResolvedValue({})
      bridge.registerSendHandler(mockSend)

      const first = await bridge.processUtterance('Tell me a story', 'utt-100')
      expect(first).toBe(true)

      // Duplicate submission of same utterance ID
      const second = await bridge.processUtterance('Tell me a story', 'utt-100')
      expect(second).toBe(false)
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('prevents duplicate text submissions within the debounce window', async () => {
      const bridge = new VoiceAiBridge()
      const mockSend = vi.fn().mockResolvedValue({})
      bridge.registerSendHandler(mockSend)

      const first = await bridge.processUtterance('How is the weather?')
      expect(first).toBe(true)

      const second = await bridge.processUtterance('How is the weather?')
      expect(second).toBe(false)
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('transitions voiceState to PROCESSING during AI generation', async () => {
      const bridge = new VoiceAiBridge()
      let observedStateDuringProcessing = null

      const mockSend = vi.fn().mockImplementation(async () => {
        observedStateDuringProcessing = useVoiceStore.getState().voiceState
        return {}
      })
      bridge.registerSendHandler(mockSend)

      await bridge.processUtterance('How are you feel today?')
      expect(observedStateDuringProcessing).toBe(VOICE_STATES.PROCESSING)
    })
  })


  describe('Emotion Tag Extraction & Validation', () => {
    it('extracts self-closing emotion tags with integer intensity', () => {
      const raw = 'I am doing great! <emotion type="happy" intensity="85"/>'
      const parsed = parseEmotionFromResponse(raw)

      expect(parsed.type).toBe('happy')
      expect(parsed.intensity).toBe(85)
      expect(parsed.text).toBe('I am doing great!')
    })

    it('extracts emotion tags with decimal fraction intensity (0.0 - 1.0)', () => {
      const raw = '<emotion type="excited" intensity="0.92">That is so awesome!</emotion>'
      const parsed = parseEmotionFromResponse(raw)

      expect(parsed.type).toBe('excited')
      expect(parsed.intensity).toBe(92)
      expect(parsed.text).toBe('That is so awesome!')
    })

    it('extracts emotion tags with single quotes and trailing markup', () => {
      const raw = "<emotion type='concerned' intensity='70'/> I hope everything is alright."
      const parsed = parseEmotionFromResponse(raw)

      expect(parsed.type).toBe('concerned')
      expect(parsed.intensity).toBe(70)
      expect(parsed.text).toBe('I hope everything is alright.')
    })

    it('maps synonym emotion types correctly', () => {
      const raw = 'Let us relax. <emotion type="peaceful" intensity="60"/>'
      const parsed = parseEmotionFromResponse(raw)

      expect(parsed.type).toBe('neutral')
      expect(parsed.intensity).toBe(60)
      expect(parsed.text).toBe('Let us relax.')
    })

    it('provides safe fallback when emotion tag is missing or malformed', () => {
      const raw = 'Just a regular friendly reply with no tags.'
      const parsed = parseEmotionFromResponse(raw)

      expect(parsed.type).toBe('neutral')
      expect(parsed.intensity).toBe(65)
      expect(parsed.text).toBe('Just a regular friendly reply with no tags.')
    })

    it('completely strips broken or partial XML tags from visible text', () => {
      const raw = 'Hello there! <emotion type="happy"> <invalidTag>'
      const parsed = parseEmotionFromResponse(raw)

      expect(parsed.text).not.toContain('<emotion')
      expect(parsed.type).toBe('happy')
    })
  })
})
