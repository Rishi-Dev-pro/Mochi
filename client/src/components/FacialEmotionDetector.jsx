import { useEffect, useRef, useState } from 'react'
import { getFacialEmotionDetector } from '../services/facialEmotionService'
import { useEmotionStore } from '../store/emotionStore'

export default function FacialEmotionDetector({ videoRef, isActive }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const detectorRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Initialize detector
  useEffect(() => {
    let isMounted = true

    const initDetector = async () => {
      try {
        const detector = getFacialEmotionDetector()
        const success = await detector.initialize()

        if (!isMounted) return

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
        if (isMounted) {
          setError('Error loading emotion models')
          setIsLoading(false)
        }
      }
    }

    initDetector()

    return () => {
      isMounted = false
    }
  }, [])

  // Run emotion detection loop
  useEffect(() => {
    if (isLoading || !isActive || !detectorRef.current || !videoRef?.current) {
      return
    }

    let isSubscribed = true

    const detectLoop = async () => {
      if (!isSubscribed) return

      try {
        const video = videoRef.current
        if (video && !video.paused && video.readyState >= 2) {
          // Detect emotion from video
          const emotionData = await detectorRef.current.detectEmotionFromVideo(video)

          if (emotionData && isSubscribed) {
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
              useEmotionStore.getState().setEmotion(
                smoothedEmotion.emotion,
                intensity,
                context,
                'facial_expression'
              )
            }
          }
        }
      } catch (err) {
        console.error('Emotion detection loop error:', err)
      }

      // Continue loop if still subscribed
      if (isSubscribed) {
        animationFrameRef.current = requestAnimationFrame(detectLoop)
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectLoop)

    return () => {
      isSubscribed = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, videoRef, isLoading])

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
