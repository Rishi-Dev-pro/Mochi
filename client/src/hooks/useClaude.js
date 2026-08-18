import { useCallback, useEffect } from 'react'
import { sendChatMessage, parseEmotionFromResponse } from '../services/llmService'
import { useEmotionStore } from '../store/emotionStore'
import { useConversationStore } from '../store/useConversationStore'
import { buildEmotionContext } from '../services/emotionAwareChatService'
import { addEmotionToHistory } from '../services/emotionHistoryService'
import { uploadEmotionToCloud } from '../services/emotionCloudService'
import { voiceAiBridge } from '../voice/voiceAiBridge'
import { ttsService } from '../voice/ttsService'

export function useClaude() {
  const messages = useConversationStore((state) => state.messages)
  const loading = useConversationStore((state) => state.loading)
  const error = useConversationStore((state) => state.error)
  const setMessages = useConversationStore((state) => state.setMessages)
  const setLoading = useConversationStore((state) => state.setLoading)
  const setError = useConversationStore((state) => state.setError)
  const clearMessages = useConversationStore((state) => state.clearMessages)

  const sendMessage = useCallback(async (userInput) => {
    const trimmedInput = userInput?.trim()
    if (!trimmedInput || loading) return

    setError(null)
    setLoading(true)

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      const currentEmotion = useEmotionStore.getState().currentEmotion
      const emotionContext = buildEmotionContext(currentEmotion)

      const currentHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const rawResponse = await sendChatMessage(currentHistory, [], emotionContext)
      const parsed = parseEmotionFromResponse(rawResponse)

      // Update 3D Mochi companion emotion store
      if (parsed.type) {
        useEmotionStore.getState().setEmotion(
          parsed.type,
          parsed.intensity,
          `Chat: "${parsed.text.slice(0, 30)}"`,
          'message'
        )

        // Persist emotion event locally & sync to cloud
        const emotionEntry = {
          type: parsed.type,
          intensity: parsed.intensity,
          context: `AI response: "${parsed.text.slice(0, 30)}"`,
          triggeredBy: 'message',
          timestamp: Date.now()
        }
        addEmotionToHistory(emotionEntry)
        uploadEmotionToCloud(emotionEntry).catch((err) => {
          console.warn('[useClaude] Background cloud sync notice:', err)
        })
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: parsed.text,
        emotion: parsed.type,
        intensity: parsed.intensity > 1 ? parsed.intensity / 100 : parsed.intensity,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Speak assistant response out loud through Web Audio TTS Subsystem
      if (parsed.text) {
        ttsService.speak(parsed.text).catch((err) => {
          console.warn('[useClaude] Speech synthesis playback notice:', err)
        })
      }

      return assistantMessage
    } catch (err) {
      console.error('Error sending message to AI:', err)
      setError(err.message || 'An unexpected error occurred.')
      throw err
    } finally {
      setLoading(false)
    }
  }, [messages, loading])


  // Register voiceAiBridge send handler so voice input routes through this same pipeline
  useEffect(() => {
    voiceAiBridge.registerSendHandler(sendMessage)
    return () => {
      voiceAiBridge.unregisterSendHandler()
    }
  }, [sendMessage])

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  }
}

