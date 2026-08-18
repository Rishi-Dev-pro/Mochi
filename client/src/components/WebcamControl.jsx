import React from 'react'
import { useWebcam } from '../context/WebcamContext'
import './WebcamControl.css'

export default function WebcamControl({ showDetails = true }) {
  const { isEnabled, status, enableWebcam, disableWebcam } = useWebcam()

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return { text: '🟢 Live Tracking', className: 'status-active' }
      case 'requesting':
        return { text: '⏳ Requesting Permission...', className: 'status-requesting' }
      case 'denied':
        return { text: '⚠️ Access Denied', className: 'status-denied' }
      case 'error':
        return { text: '❌ Camera Error', className: 'status-error' }
      default:
        return { text: '📷 Inactive', className: 'status-idle' }
    }
  }

  const badge = getStatusBadge()

  return (
    <div className={`webcam-control-panel ${isEnabled ? 'is-active' : ''}`}>
      <div className="webcam-control-header">
        <div className="webcam-control-title">
          <span className="webcam-icon">🎥</span>
          <span className="webcam-label">Webcam Emotion & Gesture Detection</span>
          <span className={`webcam-status-pill ${badge.className}`}>{badge.text}</span>
        </div>

        <div className="webcam-control-actions">
          {!isEnabled ? (
            <button
              className="btn-primary btn-md"
              onClick={enableWebcam}
              disabled={status === 'requesting'}
              title="Enable Webcam Detection"
            >
              🎥 Enable Webcam
            </button>
          ) : (
            <button
              className="btn-danger btn-md"
              onClick={disableWebcam}
              title="Disable Webcam Detection"
            >
              🚫 Disable Webcam
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <p className="webcam-control-desc">
          {status === 'active'
            ? '✅ Webcam is actively detecting facial expressions & body gestures 100% locally.'
            : status === 'denied'
            ? '❌ Camera access was denied in browser settings. Please allow camera permissions.'
            : 'Enable webcam to let Mochi sense your facial emotions & gestures in real time.'}
        </p>
      )}
    </div>
  )
}
