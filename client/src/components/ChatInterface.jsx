import React, { useState, useRef, useEffect } from 'react'
import { useClaude } from '../hooks/useClaude'
import './ChatInterface.css'

const EMOTION_MAP = {
  happy: { emoji: '😊', label: 'Happy', color: '#4ade80' },
  curious: { emoji: '🧐', label: 'Curious', color: '#60a5fa' },
  concerned: { emoji: '💙', label: 'Concerned', color: '#a78bfa' },
  sleepy: { emoji: '😴', label: 'Sleepy', color: '#facc15' },
  excited: { emoji: '🎉', label: 'Excited', color: '#f472b6' },
  neutral: { emoji: '✨', label: 'Calm', color: '#94a3b8' },
}

const QUICK_SUGGESTIONS = [
  'How are you feeling today?',
  'I had a long day, can we talk?',
  'Tell me something comforting!',
  'What is your favorite activity?',
]

export default function ChatInterface() {
  const { messages, loading, error, sendMessage, clearMessages } = useClaude()
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = (e) => {
    e?.preventDefault()
    if (!inputText.trim() || loading) return
    sendMessage(inputText)
    setInputText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion) => {
    if (loading) return
    sendMessage(suggestion)
  }

  return (
    <div className="chat-container">
      {/* Header bar */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="mochi-avatar-badge">🍡</div>
          <div>
            <h3>Mochi AI</h3>
            <span className="online-indicator">
              <span className="online-dot"></span> Online Companion
            </span>
          </div>
        </div>
        <button
          className="btn-clear-chat"
          onClick={clearMessages}
          title="Clear Conversation"
          disabled={loading}
        >
          Reset Chat
        </button>
      </div>

      {/* Error alert banner if any */}
      {error && (
        <div className="chat-error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {/* Message Stream */}
      <div className="messages-list">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          const emotionMeta = !isUser && msg.emotion ? EMOTION_MAP[msg.emotion] || EMOTION_MAP.neutral : null

          return (
            <div
              key={msg.id}
              className={`message-row ${isUser ? 'user-row' : 'assistant-row'}`}
            >
              {!isUser && <div className="message-avatar">🍡</div>}
              <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                {emotionMeta && (
                  <div
                    className="emotion-badge"
                    style={{ borderColor: emotionMeta.color }}
                  >
                    <span>{emotionMeta.emoji}</span>
                    <span className="emotion-label">{emotionMeta.label}</span>
                  </div>
                )}
                <div className="message-text">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {isUser && <div className="message-avatar user-avatar-icon">👤</div>}
            </div>
          )
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="message-row assistant-row">
            <div className="message-avatar">🍡</div>
            <div className="message-bubble assistant-bubble loading-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">Mochi is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      {messages.length <= 2 && !loading && (
        <div className="suggestions-container">
          <span className="suggestions-title">Ideas to get started:</span>
          <div className="suggestions-chips">
            {QUICK_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box Form */}
      <form className="chat-input-form" onSubmit={handleSend}>
        <textarea
          className="chat-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Talk to Mochi... (Press Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-send-message"
          disabled={!inputText.trim() || loading}
        >
          <span>Send</span>
          <svg
            className="send-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  )
}
