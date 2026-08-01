import { useRef, useState, useCallback, useEffect } from 'react'
import {
  detectWave,
  detectNod,
  detectPoint,
  updateGestureHistory,
  validateGestureSequence,
  GESTURE_CONFIG
} from '../services/gestureService'

export function useGestureDetection() {
  const [lastGesture, setLastGesture] = useState(null)
  const detectionHistoryRef = useRef([]) // Track last N detections
  const gestureHistoryRef = useRef({})
  const lastGestureTimeRef = useRef(0)
  const frameCountRef = useRef(0)

  useEffect(() => {
    const handleGesture = (e) => {
      if (e.detail) {
        setLastGesture(e.detail)
      }
    }
    window.addEventListener('mochi-gesture', handleGesture)
    return () => window.removeEventListener('mochi-gesture', handleGesture)
  }, [])

  const detectGesture = useCallback((keypoints) => {
    frameCountRef.current += 1
    const now = Date.now()

    // Update smoothed history
    gestureHistoryRef.current = updateGestureHistory(
      keypoints,
      gestureHistoryRef.current
    )

    // Try to detect each gesture
    const waveDetection = detectWave(keypoints, gestureHistoryRef.current, frameCountRef.current)
    const nodDetection = detectNod(keypoints, gestureHistoryRef.current, frameCountRef.current)
    const pointDetection = detectPoint(keypoints, gestureHistoryRef.current, frameCountRef.current)

    // Build detection list (most confident first)
    const detections = [waveDetection, nodDetection, pointDetection]
      .filter(d => d !== null)
      .sort((a, b) => b.confidence - a.confidence)

    // Add to history (keep last 10 frames)
    detectionHistoryRef.current.push(detections[0] || null)
    if (detectionHistoryRef.current.length > 10) {
      detectionHistoryRef.current.shift()
    }

    // Validate gesture sequence (must be confirmed over N frames)
    const confirmedGesture = validateGestureSequence(detectionHistoryRef.current)

    if (confirmedGesture && now - lastGestureTimeRef.current > GESTURE_CONFIG.COOLDOWN) {
      setLastGesture(confirmedGesture)
      lastGestureTimeRef.current = now
      // Clear history after detection
      detectionHistoryRef.current = []
      window.dispatchEvent(new CustomEvent('mochi-gesture', { detail: confirmedGesture }))
      return confirmedGesture
    }

    return null
  }, [])

  const clearLastGesture = useCallback(() => {
    setLastGesture(null)
  }, [])

  return { lastGesture, detectGesture, clearLastGesture }
}
