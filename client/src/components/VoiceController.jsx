import React, { useEffect, useState } from 'react'
import { useVoiceStore } from '../store/useVoiceStore'
import { VOICE_STATES, PERMISSION_STATES } from '../voice/config'
import './VoiceController.css'

export default function VoiceController({ onTranscriptReceived }) {
  const {
    voiceMode,
    permissionState,
    voiceState,
    audioLevel,
    isSpeaking,
    ttsState,
    isMochiSpeaking,
    outputAudioLevel,
    interimTranscript,
    finalTranscript,
    transcriptHistory,
    error,
    toggleVoiceMode,
    clearTranscripts,
    resetError,
    stopTts
  } = useVoiceStore()

  const [showHistory, setShowHistory] = useState(false)

  // Notify parent on newly finalized utterance
  useEffect(() => {
    if (finalTranscript && onTranscriptReceived) {
      onTranscriptReceived(finalTranscript)
    }
  }, [finalTranscript, onTranscriptReceived])

  // Generate status badge label and style class
  const getStatusInfo = () => {
    if (isMochiSpeaking || ttsState === 'SPEAKING') {
      return { text: '🔊 Mochi Speaking...', className: 'speaking' }
    }
    if (permissionState === PERMISSION_STATES.DENIED) {
      return { text: '⚠️ Mic Permission Denied', className: 'denied' }
    }
    if (permissionState === PERMISSION_STATES.UNSUPPORTED) {
      return { text: '❌ Browser Not Supported', className: 'error' }
    }
    if (voiceState === VOICE_STATES.REQUESTING_PERMISSION) {
      return { text: '⏳ Requesting Mic...', className: 'idle' }
    }
    if (!voiceMode || voiceState === VOICE_STATES.IDLE) {
      return { text: '🎤 Voice Off', className: 'idle' }
    }
    if (voiceState === VOICE_STATES.SPEECH_STARTED || isSpeaking) {
      return { text: '🗣️ You Speaking...', className: 'speaking' }
    }
    if (voiceState === VOICE_STATES.TRANSCRIBING) {
      return { text: '📝 Transcribing...', className: 'transcribing' }
    }
    if (voiceState === VOICE_STATES.THINKING) {
      return { text: '🧠 Mochi Thinking...', className: 'transcribing' }
    }
    if (voiceState === VOICE_STATES.RESPONDING) {
      return { text: '💬 Responding...', className: 'speaking' }
    }
    if (voiceState === VOICE_STATES.SPEECH_ENDED) {
      return { text: '✨ Utterance Complete', className: 'speaking' }
    }
    if (voiceState === VOICE_STATES.LISTENING) {
      return { text: '🎤 Listening Hands-Free...', className: 'listening' }
    }
    if (voiceState === VOICE_STATES.ERROR) {
      return { text: `❌ Error: ${error || 'Voice error'}`, className: 'error' }
    }
    return { text: '🎤 Ready', className: 'idle' }
  }

  const statusInfo = getStatusInfo()

  // Generate visualizer bar heights based on current audio level (input or output)
  const activeLevel = isMochiSpeaking ? Math.round(outputAudioLevel * 100) : audioLevel
  const numBars = 12
  const bars = Array.from({ length: numBars }).map((_, i) => {
    if ((!voiceMode && !isMochiSpeaking) || activeLevel === 0) return 4
    // Natural bell curve distribution for audio meter visualizer
    const centerFactor = 1 - Math.abs(i - (numBars - 1) / 2) / (numBars / 2)
    const randomized = Math.sin((i + 1) * (activeLevel + 1) * 0.1) * 0.2 + 0.8
    const height = Math.max(4, Math.min(28, (activeLevel / 100) * 28 * centerFactor * randomized))
    return Math.round(height)
  })

  return (
    <div className={`voice-controller-panel ${voiceMode || isMochiSpeaking ? 'active' : ''}`}>
      {/* Header with Title, Status & Toggle */}
      <div className="voice-controller-header">
        <div className="voice-header-left">
          <h3 className="voice-title">
            <span>🌸</span> Hands-Free Voice Input & TTS
          </h3>
          <span className={`voice-status-pill ${statusInfo.className}`}>
            {statusInfo.text}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {isMochiSpeaking && (
            <button
              className="btn-danger"
              onClick={stopTts}
              title="Stop Mochi's Speech"
            >
              ⏹️ Stop Speech
            </button>
          )}

          <button
            className={voiceMode ? 'btn-danger' : 'btn-primary'}
            onClick={toggleVoiceMode}
            title={voiceMode ? 'Stop Hands-Free Voice' : 'Start Hands-Free Voice'}
          >
            {voiceMode ? '🛑 Stop Voice Mode' : '🎤 Start Voice Mode'}
          </button>
        </div>
      </div>


      {/* Error alert banner if any */}
      {error && (
        <div style={{
          background: 'rgba(255, 118, 117, 0.25)',
          border: '1px solid #ff7675',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {error}</span>
          <button className="btn-mini" onClick={resetError}>Dismiss</button>
        </div>
      )}

      {/* Audio Visualizer & VAD Meter */}
      {voiceMode && (
        <div className="voice-visualizer-container">
          <div className="visualizer-bars">
            {bars.map((h, idx) => (
              <div
                key={idx}
                className={`visualizer-bar ${isSpeaking || audioLevel > 15 ? 'active' : ''}`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
          <span className={`vad-indicator-badge ${isSpeaking ? 'speaking' : 'quiet'}`}>
            {isSpeaking ? '🗣️ VAD: ACTIVE' : '🌿 VAD: SILENT'}
          </span>
        </div>
      )}

      {/* Live Transcript Display HUD */}
      <div className="voice-transcript-box">
        {interimTranscript ? (
          <div>
            <span className="transcript-final">{finalTranscript ? finalTranscript + ' ' : ''}</span>
            <span className="transcript-interim">"{interimTranscript}..."</span>
          </div>
        ) : finalTranscript ? (
          <div className="transcript-final">
            💬 "{finalTranscript}"
          </div>
        ) : (
          <div className="transcript-placeholder">
            {voiceMode
              ? '✨ Speak naturally. Mochi is listening hands-free...'
              : 'Voice mode is currently off. Click "Start Voice Mode" to speak.'}
          </div>
        )}
      </div>

      {/* History & Controls */}
      <div className="transcript-actions">
        {transcriptHistory.length > 0 && (
          <>
            <button
              className="btn-mini"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? '▲ Hide History' : `▼ History (${transcriptHistory.length})`}
            </button>
            <button
              className="btn-mini"
              onClick={clearTranscripts}
            >
              🗑️ Clear
            </button>
          </>
        )}
      </div>

      {/* Utterance History Dropdown */}
      {showHistory && transcriptHistory.length > 0 && (
        <div className="voice-history-summary">
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ffb7c5' }}>
            📜 Recent Utterances:
          </div>
          {transcriptHistory.slice(0, 5).map((item) => (
            <div key={item.id} className="history-item">
              <span className="history-item-time">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="history-item-text">"{item.text}"</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
