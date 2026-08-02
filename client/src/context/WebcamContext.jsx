import { createContext, useContext, useRef, useState, useEffect } from 'react'
import PoseDetector from '../components/PoseDetector'
import FacialEmotionDetector from '../components/FacialEmotionDetector'

const WebcamContext = createContext()

export function WebcamProvider({ children }) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [status, setStatus] = useState('idle') // idle, requesting, active, denied, error
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Request camera permission
  const enableWebcam = async () => {
    if (isEnabled) return

    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (error) {
          console.warn('Autoplay warning:', error)
        }
      }
      setStatus('active')
      setIsEnabled(true)
    } catch (error) {
      console.error('Webcam error:', error)
      if (error.name === 'NotAllowedError') {
        setStatus('denied')
      } else {
        setStatus('error')
      }
    }
  }

  // Ensure stream stays bound to videoRef when enabled
  useEffect(() => {
    if (isEnabled && status === 'active' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current
        videoRef.current.play().catch(console.warn)
      }
    }
  }, [isEnabled, status])

  // Disable camera
  const disableWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsEnabled(false)
    setStatus('idle')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <WebcamContext.Provider
      value={{
        isEnabled,
        status,
        videoRef,
        streamRef,
        enableWebcam,
        disableWebcam
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none'
        }}
      />
      {status === 'active' && <PoseDetector videoRef={videoRef} />}
      {status === 'active' && <FacialEmotionDetector videoRef={videoRef} isActive={status === 'active'} />}
      {children}
    </WebcamContext.Provider>
  )
}

export function useWebcam() {
  const context = useContext(WebcamContext)
  if (!context) {
    throw new Error('useWebcam must be used within WebcamProvider')
  }
  return context
}
