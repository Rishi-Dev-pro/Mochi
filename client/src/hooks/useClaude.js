import { useState, useCallback } from 'react'
import { sendChatMessage, parseEmotionFromResponse } from '../services/llmService'

const INITIAL_MOCHI_MESSAGE = {
  id: 'welcome-msg',
  role: 'assistant',
  content: 'Hello! I am Mochi, your companion. How are you feeling today?',
  emotion: 'happy',
  intensity: 0.9,
  timestamp: new Date().toISOString(),
}

/**
 * Parses raw text from Claude response to extract XML emotion tags and clean message content.
 * @param {string} rawText - Raw text response from Claude.
 * @returns {{ emotion: string, intensity: number, text: string }}
 */
export function parseEmotionAndText(rawText) {
  if (!rawText) {
    return { emotion: 'neutral', intensity: 0.5, text: '' }
  }

  const emotionRegex = /<emotion\s+type=["'](\w+)["'](?:\s+intensity=["']([0-9.]+)["'])?\s*>([\s\S]*?)<\/emotion>/i
  const match = rawText.match(emotionRegex)

  if (match) {
    const emotionType = match[1].toLowerCase()
    const intensity = match[2] ? parseFloat(match[2]) : 0.8
    const textContent = match[3].trim()
    return {
      emotion: emotionType,
      intensity: isNaN(intensity) ? 0.8 : intensity,
      text: textContent,
    }
  }

  // Fallback if tags are omitted or formatted slightly differently
  const cleanText = rawText.replace(/<\/?emotion[^>]*>/gi, '').trim()
  return {
    emotion: 'happy',
    intensity: 0.7,
    text: cleanText || rawText,
  }
}

export function useClaude() {
  const [messages, setMessages] = useState([INITIAL_MOCHI_MESSAGE])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendMessage = useCallback(async (userInput) => {
    const trimmedInput = userInput.trim()
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
      // Build history for API request
      const currentHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const rawResponse = await sendChatMessage(currentHistory)
      const parsed = parseEmotionAndText(rawResponse)

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: parsed.text,
        emotion: parsed.emotion,
        intensity: parsed.intensity,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

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
