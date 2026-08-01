import React from 'react'
import ChatInterface from '../components/ChatInterface'

export default function ChatPage() {
  return (
    <div className="page">
      <h1>Chat with Mochi</h1>
      <p>Have a comforting conversation with your AI companion.</p>
      <ChatInterface />
    </div>
  )
}
