import React, { useEffect, useRef } from 'react'
import { useWebcam } from '../context/WebcamContext'
import PoseDetector from './PoseDetector'
import './WebcamFeed.css'

export default function WebcamFeed() {
  const { isEnabled, status, videoRef, streamRef, enableWebcam, disableWebcam } = useWebcam()
  const previewVideoRef = useRef(null)

  useEffect(() => {
    if (isEnabled && status === 'active' && previewVideoRef.current && streamRef.current) {
      if (previewVideoRef.current.srcObject !== streamRef.current) {
        previewVideoRef.current.srcObject = streamRef.current
        previewVideoRef.current.play().catch(console.warn)
      }
    }
  }, [isEnabled, status, streamRef])

  return (
    <div className="webcam-container">
      <h3>🎥 Webcam Video Feed</h3>
      <p className="subtitle">Real-time facial emotion detection and motion tracking</p>

      {/* Centered Webcam Preview Container */}
      <div className="webcam-wrapper">
        <video
          ref={previewVideoRef}
          autoPlay
          playsInline
          muted
          className="video-feed"
          style={{ display: status === 'active' ? 'block' : 'none' }}
        />

        {status === 'active' && (
          <div className="camera-indicator">
            <span className="recording-dot"></span>
            LIVE
          </div>
        )}

        {status !== 'active' && (
          <div className="placeholder">
            <p className="placeholder-icon">📷</p>
            <p>{status === 'requesting' ? 'Requesting camera permissions...' : 'Webcam inactive'}</p>
          </div>
        )}
      </div>

      <div className="button-group">
        {status === 'idle' || status === 'denied' || status === 'error' ? (
          <button className="btn-primary btn-lg" onClick={enableWebcam}>
            🎥 Enable Webcam
          </button>
        ) : (
          <button className="btn-danger btn-lg" onClick={disableWebcam}>
            🚫 Disable Webcam
          </button>
        )}
      </div>

      <p className="info-text">
        {status === 'active' && '✅ Webcam is active. Real-time emotion recognition running.'}
        {status === 'requesting' && '⏳ Requesting camera permission...'}
        {status === 'denied' && '❌ Camera access denied. Please allow camera in browser settings.'}
        {status === 'error' && '❌ Camera error. Please refresh and try again.'}
        {status === 'idle' && '📷 Enable webcam to start motion & emotion detection.'}
      </p>

      {/* Pose Skeleton Display - ONLY rendered here below the centered webcam on Settings page */}
      {status === 'active' && (
        <div className="skeleton-sub-panel">
          <h4 style={{ color: 'var(--mc-sakura-light)', margin: '0 0 10px 0', fontSize: '1.1rem' }}>
            🦴 Pose Skeleton Tracking Screen
          </h4>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.88rem', margin: '0 0 12px 0' }}>
            Real-time MoveNet keypoint skeleton detector
          </p>
          <PoseDetector videoRef={videoRef} />
        </div>
      )}
    </div>
  )
}
