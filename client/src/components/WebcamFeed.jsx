import React, { useEffect, useRef, useState } from 'react'
import PoseDetector from './PoseDetector'
import './WebcamFeed.css'

export default function WebcamFeed() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | requesting | active | denied | error
  const [error, setError] = useState(null)

  const requestCameraAccess = async () => {
    setStatus('requesting')
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.warn('Autoplay warning:', playErr)
        }
      }

      setStatus('active')
    } catch (err) {
      console.error('Camera error:', err)

      if (err.name === 'NotAllowedError') {
        setStatus('denied')
        setError('Camera permission denied. Please allow access in browser settings.')
      } else if (err.name === 'NotFoundError') {
        setStatus('error')
        setError('No camera found on this device.')
      } else {
        setStatus('error')
        setError(`Camera error: ${err.message}`)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('idle')
  }

  // Guarantee stream is bound to video element whenever active
  useEffect(() => {
    if (status === 'active' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current
        videoRef.current.play().catch(console.warn)
      }
    }
  }, [status])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="webcam-container">
      <h3>Webcam Feed</h3>
      <p className="subtitle">For gesture detection and motion tracking</p>

      <div className="webcam-wrapper">
        <video
          ref={videoRef}
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

      {error && <div className="error-message">{error}</div>}

      {status === 'active' && <PoseDetector videoRef={videoRef} />}

      <div className="button-group">
        {status === 'idle' || status === 'denied' || status === 'error' ? (
          <button className="btn btn-primary" onClick={requestCameraAccess}>
            Enable Webcam
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopCamera}>
            Disable Webcam
          </button>
        )}
      </div>

      <p className="info-text">
        {status === 'active' && '✅ Webcam is active. Ready for gesture detection.'}
        {status === 'requesting' && '⏳ Requesting camera permission...'}
        {status === 'denied' && '❌ Camera access denied. Check browser settings.'}
        {status === 'error' && '❌ Camera error. Try reloading the page.'}
        {status === 'idle' && '📷 Click button to enable webcam.'}
      </p>
    </div>
  )
}
