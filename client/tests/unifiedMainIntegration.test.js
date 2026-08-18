/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useConversationStore, INITIAL_MOCHI_MESSAGE } from '../src/store/useConversationStore'
import { useVoiceStore } from '../src/store/useVoiceStore'
import { VOICE_STATES, TTS_STATES } from '../src/voice/config'
import { voiceAiBridge } from '../src/voice/voiceAiBridge'

describe('Unified Main Experience Integration Test Suite', () => {
  beforeEach(() => {
    useConversationStore.getState().clearMessages()
    useVoiceStore.setState({
      voiceMode: false,
      voiceState: VOICE_STATES.IDLE,
      ttsState: TTS_STATES.IDLE,
      isMochiSpeaking: false,
      interimTranscript: '',
      finalTranscript: '',
      transcriptHistory: []
    })
  })

  describe('Conversation Store Single Source of Truth', () => {
    it('initializes with default welcome message and allows adding messages', () => {
      const store = useConversationStore.getState()
      expect(store.messages.length).toBe(1)
      expect(store.messages[0].role).toBe('assistant')
      expect(store.messages[0].content).toContain('Hello! I am Mochi')

      store.addMessage({
        id: 'msg-user-1',
        role: 'user',
        content: 'Hey Mochi!'
      })

      expect(useConversationStore.getState().messages.length).toBe(2)
      expect(useConversationStore.getState().messages[1].content).toBe('Hey Mochi!')
    })

    it('clears messages back to welcome message cleanly', () => {
      useConversationStore.getState().addMessage({ id: 'msg-1', role: 'user', content: 'Test' })
      expect(useConversationStore.getState().messages.length).toBe(2)

      useConversationStore.getState().clearMessages()
      expect(useConversationStore.getState().messages.length).toBe(1)
      expect(useConversationStore.getState().messages[0].role).toBe('assistant')
    })

    it('supports functional updates to messages array', () => {
      useConversationStore.getState().setMessages((prev) => [
        ...prev,
        { id: 'msg-custom', role: 'user', content: 'Functional update' }
      ])

      const msgs = useConversationStore.getState().messages
      expect(msgs.length).toBe(2)
      expect(msgs[1].content).toBe('Functional update')
    })
  })

  describe('Voice State Machine & AI Bridge Integration on Unified Main Page', () => {
    it('processes user voice utterance and synchronizes state correctly', async () => {
      const mockHandler = vi.fn().mockImplementation(async (text) => {
        useConversationStore.getState().addMessage({
          id: 'ai-resp-1',
          role: 'assistant',
          content: `Echo: ${text}`,
          emotion: 'happy'
        })
        return { success: true }
      })

      voiceAiBridge.reset()
      voiceAiBridge.registerSendHandler(mockHandler)

      // Start voice mode
      useVoiceStore.setState({ voiceMode: true, voiceState: VOICE_STATES.LISTENING })

      const submitted = await voiceAiBridge.processUtterance('Hey Mochi, how are you?')
      expect(submitted).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('Hey Mochi, how are you?', expect.any(String))

      // Check that message was placed in conversation store
      const messages = useConversationStore.getState().messages
      expect(messages.some((m) => m.content === 'Echo: Hey Mochi, how are you?')).toBe(true)
    })

    it('coordinates full speech -> thinking -> speaking cycle with conversation store', async () => {
      const mockHandler = vi.fn().mockImplementation(async () => {
        useVoiceStore.getState().setTtsState(TTS_STATES.SPEAKING)
        return { success: true }
      })

      voiceAiBridge.reset()
      voiceAiBridge.registerSendHandler(mockHandler)

      useVoiceStore.setState({ voiceMode: true, voiceState: VOICE_STATES.LISTENING })

      // 1. User speaking
      useVoiceStore.getState().setInterimTranscript('Good morning')
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.USER_SPEAKING)

      // 2. Finalize & submit
      await voiceAiBridge.processUtterance('Good morning')
      expect(useVoiceStore.getState().isMochiSpeaking).toBe(true)
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.MOCHI_SPEAKING)

      // 3. TTS completes -> returns to listening
      useVoiceStore.getState().setTtsState(TTS_STATES.COMPLETED)
      expect(useVoiceStore.getState().voiceState).toBe(VOICE_STATES.LISTENING)
      expect(useVoiceStore.getState().isMochiSpeaking).toBe(false)
    })
  })
})
