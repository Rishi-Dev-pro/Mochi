import React, { useEffect, useRef, useState } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import './PoseDetector.css'

export default function PoseDetector({ videoRef }) {
  const canvasRef = useRef(null)
  const [poseDetector, setPoseDetector] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [poses, setPoses] = useState([])
  const detectionLoopRef = useRef(null)

  // Initialize pose detector
  useEffect(() => {
    let isMounted = true
    const initializePoseDetection = async () => {
      try {
        setLoading(true)
        
        // Load TensorFlow backend
        await tf.ready()

        // Create MoveNet SinglePose Lightning detector
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: poseDetection.movenet?.modelType?.SINGLEPOSE_LIGHTNING || 'SinglePose.Lightning'
          }
        )

        if (isMounted) {
          setPoseDetector(detector)
          setError(null)
        }
      } catch (err) {
        console.error('Pose detection init error:', err)
        if (isMounted) {
          setError(`Failed to load pose detection: ${err.message}`)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializePoseDetection()

    return () => {
      isMounted = false
    }
  }, [])

  // Detection loop
  useEffect(() => {
    if (!poseDetector || !videoRef?.current) return

    let isSubscribed = true

    const detect = async () => {
      const video = videoRef.current
      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        try {
          const detectedPoses = await poseDetector.estimatePoses(video)
          if (isSubscribed) {
            setPoses(detectedPoses)
          }
        } catch (err) {
          console.error('Pose detection estimation error:', err)
        }
      }

      if (isSubscribed) {
        detectionLoopRef.current = requestAnimationFrame(detect)
      }
    }

    detect()

    return () => {
      isSubscribed = false
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current)
      }
    }
  }, [poseDetector, videoRef])

  // Draw skeleton on canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !videoRef?.current) return

    const ctx = canvas.getContext('2d')
    const video = videoRef.current

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (poses.length > 0) {
        const pose = poses[0]
        drawSkeleton(ctx, pose.keypoints)
      }
    }

    draw()
  }, [poses, videoRef])

  const drawSkeleton = (ctx, keypoints) => {
    // Keypoint pairs for skeleton lines
    const pairs = [
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Arms
      [5, 11], [6, 12], [11, 12], // Torso
      [11, 13], [13, 15], [12, 14], [14, 16] // Legs
    ]

    const minConfidence = 0.3

    // Draw lines
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    pairs.forEach(([start, end]) => {
      const startKp = keypoints[start]
      const endKp = keypoints[end]

      if (startKp?.score > minConfidence && endKp?.score > minConfidence) {
        ctx.beginPath()
        ctx.moveTo(startKp.x, startKp.y)
        ctx.lineTo(endKp.x, endKp.y)
        ctx.stroke()
      }
    })

    // Draw keypoints (circles)
    keypoints.forEach((kp) => {
      if (kp.score > minConfidence) {
        ctx.fillStyle = '#a5b4fc'
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
  }

  return (
    <div className="pose-detector-container">
      {loading && (
        <div className="loading-message">
          <p>Loading pose detection model...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="pose-canvas" />
        {poses.length > 0 && (
          <div className="pose-info">
            Pose detected ({poses[0].keypoints.filter((kp) => kp.score > 0.3).length} points)
          </div>
        )}
      </div>
    </div>
  )
}
