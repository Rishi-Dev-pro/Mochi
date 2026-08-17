import { useState, useCallback, useEffect } from 'react'
import { sendChatMessage, parseEmotionFromResponse } from '../services/llmService'
import { useEmotionStore } from '../store/emotionStore'
import { buildEmotionContext } from '../services/emotionAwareChatService'
import { addEmotionToHistory } from '../services/emotionHistoryService'
import { uploadEmotionToCloud } from '../services/emotionCloudService'
import { voiceAiBridge } from '../voice/voiceAiBridge'
import { ttsService } from '../voice/ttsService'

const INITIAL_MOCHI_MESSAGE = {

  id: 'welcome-msg',
  role: 'assistant',
  content: 'Hello! I am Mochi, your companion. How are you feeling today?',
  emotion: 'happy',
  intensity: 0.9,
  timestamp: new Date().toISOString(),
}

export function useClaude() {
  const [messages, setMessages] = useState([INITIAL_MOCHI_MESSAGE])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  const clearMessages = useCallback(() => {
    setMessages([
      {
        ...INITIAL_MOCHI_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    ])
    setError(null)
  }, [])

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  }
}

