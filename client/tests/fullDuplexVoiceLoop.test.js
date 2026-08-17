/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VOICE_STATES, TTS_STATES } from '../src/voice/config'
import { voiceAiBridge } from '../src/voice/voiceAiBridge'
import { useVoiceStore } from '../src/store/useVoiceStore'

describe('Full-Duplex Hands-Free Voice Loop Suite (Milestone 5)', () => {
  let mockSendHandler

  beforeEach(() => {
    mockSendHandler = vi.fn().mockResolvedValue({ id: 'msg-1', content: 'Hello!' })
    voiceAiBridge.reset()
    voiceAiBridge.registerSendHandler(mockSendHandler)

    useVoiceStore.setState({
      voiceMode: true,
      voiceState: VOICE_STATES.LISTENING,
      isSpeaking: false,
      isMochiSpeaking: false,
      ttsState: TTS_STATES.IDLE,
      outputAudioLevel: 0.0,
      interimTranscript: '',
      finalTranscript: '',
      transcriptHistory: []
    })
  })

  describe('Authoritative Conversational State Machine', () => {
    it('transitions through full voice cycle: LISTENING -> USER_SPEAKING -> PROCESSING -> MOCHI_SPEAKING -> LISTENING', async () => {
      const store = useVoiceStore.getState()
      expect(store.voiceState).toBe(VOICE_STATES.LISTENING)

      // Step 1: User begins speaking (Interim transcript updates state to USER_SPEAKING)
      store.setInterimTranscript('Hello Mochi')
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.USER_SPEAKING)

      // Step 2: Speech finalizes and submits to AI -> transitions to PROCESSING
      const submitPromise = voiceAiBridge.processUtterance('Hello Mochi', 'utt-1')
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.PROCESSING)
      await submitPromise

      expect(mockSendHandler).toHaveBeenCalledTimes(1)

      // Step 3: Claude response triggers TTS speech -> transitions to MOCHI_SPEAKING
      useVoiceStore.getState().setTtsState(TTS_STATES.SPEAKING)
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.MOCHI_SPEAKING)
      expect(useVoiceStore.getState().isMochiSpeaking).toBe(true)

      // Step 4: TTS finishes -> automatically returns to LISTENING for next turn
      useVoiceStore.getState().setTtsState(TTS_STATES.COMPLETED)
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.LISTENING)
      expect(useVoiceStore.getState().isMochiSpeaking).toBe(false)
    })
  })

  describe('Self-Hearing Feedback Prevention Gate', () => {
    it('blocks transcript submissions while Mochi is speaking (Self-Hearing Gate)', async () => {
      // Simulate Mochi currently speaking through speakers
      useVoiceStore.setState({
        voiceState: VOICE_STATES.MOCHI_SPEAKING,
        isMochiSpeaking: true,
        ttsState: TTS_STATES.SPEAKING
      })

      // Simulate mic picking up Mochi's own speech
      const result = await voiceAiBridge.processUtterance("I am Mochi, how can I help you?", 'echo-utt-1')

      // Must be blocked by self-hearing gate
      expect(result).toBe(false)
      expect(mockSendHandler).not.toHaveBeenCalled()
    })

    it('blocks transcript submissions while Mochi is currently PROCESSING a turn', async () => {
      useVoiceStore.setState({
        voiceState: VOICE_STATES.PROCESSING
      })

      const result = await voiceAiBridge.processUtterance("Second overlapping utterance", 'echo-utt-2')
      expect(result).toBe(false)
      expect(mockSendHandler).not.toHaveBeenCalled()
    })
  })

  describe('Deduplication & Empty Utterance Protection', () => {
    it('ignores empty and whitespace-only utterances', async () => {
      expect(await voiceAiBridge.processUtterance('', 'empty-1')).toBe(false)
      expect(await voiceAiBridge.processUtterance('   ', 'empty-2')).toBe(false)
      expect(await voiceAiBridge.processUtterance(null, 'empty-3')).toBe(false)
      expect(mockSendHandler).not.toHaveBeenCalled()
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.LISTENING)
    })

    it('deduplicates identical transcripts received in rapid succession', async () => {
      const first = await voiceAiBridge.processUtterance('What is the weather today?', 'dup-1')
      const second = await voiceAiBridge.processUtterance('What is the weather today?', 'dup-2')

      expect(first).toBe(true)
      expect(second).toBe(false)
      expect(mockSendHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Recovery & Stop Speech Transitions', () => {
    it('recovers safely back to LISTENING if Claude request throws', async () => {
      mockSendHandler.mockRejectedValueOnce(new Error('Network timeout'))

      const result = await voiceAiBridge.processUtterance('Test error query', 'err-1')
      expect(result).toBe(false)
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.ERROR)
    })

    it('returns to LISTENING when stopTts() is called in voice mode', () => {
      useVoiceStore.setState({
        voiceState: VOICE_STATES.MOCHI_SPEAKING,
        isMochiSpeaking: true,
        ttsState: TTS_STATES.SPEAKING
      })

      useVoiceStore.getState().stopTts()

      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.LISTENING)
      expect(useVoiceStore.getState().isMochiSpeaking).toBe(false)
      expect(useVoiceStore.getState().outputAudioLevel).toBe(0.0)
    })
  })
})
