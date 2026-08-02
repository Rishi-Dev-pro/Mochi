import React, { useEffect, useRef } from 'react'
import { useWebcam } from '../context/WebcamContext'
import './WebcamFeed.css'

export default function WebcamFeed() {
  const { isEnabled, status, streamRef, enableWebcam, disableWebcam } = useWebcam()
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
      <h3>Webcam Feed</h3>
      <p className="subtitle">For gesture detection and motion tracking</p>

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
            Live
          </div>
        )}

        {status !== 'active' && (
          <div className="placeholder">
            <p className="placeholder-icon">📷</p>
            <p>{status === 'requesting' ? 'Requesting access...' : 'Camera not active'}</p>
          </div>
        )}
      </div>

      <div className="button-group">
        {status === 'idle' || status === 'denied' || status === 'error' ? (
          <button className="btn btn-primary" onClick={enableWebcam}>
            Enable Webcam
          </button>
        ) : (
          <button className="btn btn-danger" onClick={disableWebcam}>
            Disable Webcam
          </button>
        )}
      </div>

      <p className="info-text">
        {status === 'active' && '✅ Webcam is active across all pages. Ready for gesture & emotion detection.'}
        {status === 'requesting' && '⏳ Requesting camera permission...'}
        {status === 'denied' && '❌ Camera access denied. Check browser settings.'}
        {status === 'error' && '❌ Camera error. Try reloading the page.'}
        {status === 'idle' && '📷 Click button to enable webcam.'}
      </p>
    </div>
  )
}
