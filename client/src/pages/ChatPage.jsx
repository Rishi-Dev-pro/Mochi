import React from 'react'
import ChatInterface from '../components/ChatInterface'
import '../styles/minecraft-theme.css'
import '../styles/minecraft-blocks.css'
import '../styles/minecraft-buttons.css'
import '../styles/minecraft-effects.css'

export default function ChatPage() {
  return (
    <div className="minecraft-sky" style={{ padding: '20px', minHeight: 'calc(100vh - 70px)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header className="mc-3d-block grass-block block-appear" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="pixel-font" style={{ fontSize: '0.8rem', color: 'var(--mc-sakura-light)', marginBottom: '6px' }}>
            📖 MINECRAFT CHAT LOG
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: '4px 0' }}>Chat with Mochi</h1>
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)' }}>
            Have a cozy, comforting conversation with your emotional AI companion.
          </p>
        </header>

        <ChatInterface />
      </div>
    </div>
  )
}
