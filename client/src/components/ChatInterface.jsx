import React, { useState, useRef, useEffect } from 'react'
import { useClaude } from '../hooks/useClaude'
import './ChatInterface.css'

export default function ChatInterface() {
  const { messages, sendMessage, loading } = useClaude()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    await sendMessage(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const renderEmotion = (msg) => {
    if (!msg.emotion) return null
    if (typeof msg.emotion === 'object') {
      return `${msg.emotion.type} (${msg.emotion.intensity}%)`
    }
    const intensityVal = msg.intensity ? Math.round(msg.intensity > 1 ? msg.intensity : msg.intensity * 100) : 80
    return `${msg.emotion} (${intensityVal}%)`
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <h2>🌙 Mochi</h2>
          <span className="status-badge">Online</span>
        </div>
      </div>

      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">💬</p>
            <p>Start chatting with Mochi!</p>
            <p className="empty-hint">Say hello to begin...</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const roleClass = msg.role === 'user' ? 'user' : 'mochi'
            const emotionText = renderEmotion(msg)

            return (
              <div key={msg.id || idx} className={`message ${roleClass}`}>
                <div className="message-bubble">
                  <p>{msg.content}</p>
                  {emotionText && (
                    <div className="emotion-badge">{emotionText}</div>
                  )}
                </div>
              </div>
            )
          })
        )}
        {loading && (
          <div className="message mochi">
            <div className="message-bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          placeholder="Type a message... (Shift+Enter for new line)"
          onKeyDown={handleKeyDown}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          disabled={loading}
          rows="3"
        />
        <button
          className="send-button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
