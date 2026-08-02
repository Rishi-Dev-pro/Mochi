import { useEffect, useRef, useState } from 'react'
import { getFacialEmotionDetector } from '../services/facialEmotionService'
import { useEmotionStore } from '../store/useEmotionStore'

export default function FacialEmotionDetector({ videoRef, isActive }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const detectorRef = useRef(null)
  const animationFrameRef = useRef(null)
  const emotionStore = useEmotionStore()

  // Initialize detector
  useEffect(() => {
    const initDetector = async () => {
      try {
        const detector = getFacialEmotionDetector()
        const success = await detector.initialize()

        if (success) {
          detectorRef.current = detector
          setIsLoading(false)
          setError(null)
        } else {
          setError('Failed to load emotion detection models')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Detector init error:', err)
        setError('Error loading emotion models')
        setIsLoading(false)
      }
    }

    initDetector()
  }, [])

  // Run emotion detection loop
  useEffect(() => {
    if (!isActive || !detectorRef.current || !videoRef?.current) {
      return
    }

    const detectLoop = async () => {
      try {
        if (!videoRef.current || videoRef.current.paused) {
          animationFrameRef.current = requestAnimationFrame(detectLoop)
          return
        }

        // Detect emotion from video
        const emotionData = await detectorRef.current.detectEmotionFromVideo(
          videoRef.current
        )

        if (emotionData) {
          // Smooth emotion transitions
          const smoothedEmotion = detectorRef.current.smoothEmotion(emotionData)

          if (smoothedEmotion) {
            const intensity = detectorRef.current.confidenceToIntensity(
              smoothedEmotion.confidence
            )
            const context = detectorRef.current.getEmotionContext(
              smoothedEmotion.emotion,
              smoothedEmotion.confidence
            )

            // Update Zustand store
            emotionStore.setEmotion(
              smoothedEmotion.emotion,
              intensity,
              context,
              'facial_expression'
            )
          }
        }
      } catch (err) {
        console.error('Emotion detection loop error:', err)
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(detectLoop)
    }

    animationFrameRef.current = requestAnimationFrame(detectLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, videoRef, emotionStore])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  if (error) {
    return (
      <div style={{ color: '#f87171', padding: '8px', fontSize: '0.9rem' }}>
        ⚠️ {error}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ color: '#a3e635', padding: '8px', fontSize: '0.9rem' }}>
        Loading facial emotion detection...
      </div>
    )
  }

  return null // Invisible component, only processes video
}
