// ============ GESTURE DETECTION PARAMETERS ============

// Movement velocity thresholds (pixels per frame)
const WAVE_VELOCITY_THRESHOLD = 8 // pixels/frame horizontal movement
const NOD_VELOCITY_THRESHOLD = 6 // pixels/frame vertical movement
const POINT_DISTANCE_THRESHOLD = 80 // pixels from shoulder to wrist

// Gesture must sustain for N consecutive frames to trigger
const GESTURE_CONFIRMATION_FRAMES = 3

// Confidence thresholds (0-1)
const MIN_KEYPOINT_CONFIDENCE = 0.5 // Higher = more accurate
const MIN_SUSTAINED_CONFIDENCE = 0.6 // All frames must meet this

// Cooldown (ms) to prevent rapid-fire detections
const GESTURE_COOLDOWN = 800

// Smoothing factor for Kalman filter (0-1, lower = more smoothing)
const SMOOTHING_FACTOR = 0.3

// ============ KEYPOINT CONSTANTS ============

const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16
}

// ============ SMOOTHING UTILITY ============

function exponentialMovingAverage(current, previous, factor) {
  if (current === undefined || current === null) return previous || null
  if (previous === undefined || previous === null) return current
  return previous * (1 - factor) + current * factor
}

function calculateVelocity(current, previous) {
  if (!previous || !current) return 0
  return Math.sqrt(
    Math.pow(current.x - previous.x, 2) +
    Math.pow(current.y - previous.y, 2)
  )
}

function calculateDistance(point1, point2) {
  if (!point1 || !point2) return 0
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) +
    Math.pow(point1.y - point2.y, 2)
  )
}

// ============ GESTURE DETECTION ============

export function detectWave(keypoints, history, frameCount) {
  const leftWrist = keypoints[KEYPOINTS.LEFT_WRIST]
  const rightWrist = keypoints[KEYPOINTS.RIGHT_WRIST]
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER]
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER]

  // LEFT WAVE
  if (
    leftWrist?.score > MIN_KEYPOINT_CONFIDENCE &&
    leftShoulder?.score > MIN_KEYPOINT_CONFIDENCE
  ) {
    // Hand must be above shoulder
    if (leftWrist.y < leftShoulder.y - 30) {
      const prevWrist = history.smoothedLeftWrist
      const velocity = calculateVelocity(leftWrist, prevWrist)

      if (velocity > WAVE_VELOCITY_THRESHOLD) {
        // Check horizontal movement (not vertical)
        const horizontalVel = Math.abs(leftWrist.x - (prevWrist?.x || leftWrist.x))
        const verticalVel = Math.abs(leftWrist.y - (prevWrist?.y || leftWrist.y))

        if (horizontalVel > verticalVel * 1.5) {
          return {
            gesture: 'wave',
            side: 'left',
            confidence: leftWrist.score,
            velocity
          }
        }
      }
    }
  }

  // RIGHT WAVE
  if (
    rightWrist?.score > MIN_KEYPOINT_CONFIDENCE &&
    rightShoulder?.score > MIN_KEYPOINT_CONFIDENCE
  ) {
    // Hand must be above shoulder
    if (rightWrist.y < rightShoulder.y - 30) {
      const prevWrist = history.smoothedRightWrist
      const velocity = calculateVelocity(rightWrist, prevWrist)

      if (velocity > WAVE_VELOCITY_THRESHOLD) {
        // Check horizontal movement (not vertical)
        const horizontalVel = Math.abs(rightWrist.x - (prevWrist?.x || rightWrist.x))
        const verticalVel = Math.abs(rightWrist.y - (prevWrist?.y || rightWrist.y))

        if (horizontalVel > verticalVel * 1.5) {
          return {
            gesture: 'wave',
            side: 'right',
            confidence: rightWrist.score,
            velocity
          }
        }
      }
    }
  }

  return null
}

export function detectNod(keypoints, history, frameCount) {
  const nose = keypoints[KEYPOINTS.NOSE]
  const leftEye = keypoints[KEYPOINTS.LEFT_EYE]
  const rightEye = keypoints[KEYPOINTS.RIGHT_EYE]

  if (!nose?.score || nose.score < MIN_KEYPOINT_CONFIDENCE) return null
  if (!leftEye?.score || !rightEye?.score) return null

  const prevNose = history.smoothedNose

  if (!prevNose) return null

  const verticalVelocity = Math.abs(nose.y - prevNose.y)
  const horizontalVelocity = Math.abs(nose.x - prevNose.x)

  // Nod: More vertical than horizontal movement
  if (
    verticalVelocity > NOD_VELOCITY_THRESHOLD &&
    horizontalVelocity < verticalVelocity * 0.5
  ) {
    const avgEyeConfidence = (leftEye.score + rightEye.score) / 2
    const combinedConfidence = (nose.score + avgEyeConfidence) / 2

    if (combinedConfidence > MIN_KEYPOINT_CONFIDENCE) {
      return {
        gesture: 'nod',
        confidence: combinedConfidence,
        velocity: verticalVelocity
      }
    }
  }

  return null
}

export function detectPoint(keypoints, history, frameCount) {
  const leftWrist = keypoints[KEYPOINTS.LEFT_WRIST]
  const rightWrist = keypoints[KEYPOINTS.RIGHT_WRIST]
  const leftElbow = keypoints[KEYPOINTS.LEFT_ELBOW]
  const rightElbow = keypoints[KEYPOINTS.RIGHT_ELBOW]
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER]
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER]

  // LEFT POINT
  if (
    leftWrist?.score > MIN_KEYPOINT_CONFIDENCE &&
    leftElbow?.score > MIN_KEYPOINT_CONFIDENCE &&
    leftShoulder?.score > MIN_KEYPOINT_CONFIDENCE
  ) {
    const shoulderToWrist = calculateDistance(leftWrist, leftShoulder)
    const shoulderToElbow = calculateDistance(leftElbow, leftShoulder)
    const elbowToWrist = calculateDistance(leftWrist, leftElbow)

    // Arm must be extended (wrist far from shoulder)
    // And arm must be relatively straight (not bent too much)
    const totalArmLength = shoulderToElbow + elbowToWrist
    const armExtension = totalArmLength > 0 ? shoulderToWrist / totalArmLength : 0

    if (
      shoulderToWrist > POINT_DISTANCE_THRESHOLD &&
      armExtension > 0.7 // Arm is mostly straight
    ) {
      const avgConfidence = (leftWrist.score + leftShoulder.score) / 2
      return {
        gesture: 'point',
        side: 'left',
        confidence: avgConfidence,
        distance: shoulderToWrist
      }
    }
  }

  // RIGHT POINT
  if (
    rightWrist?.score > MIN_KEYPOINT_CONFIDENCE &&
    rightElbow?.score > MIN_KEYPOINT_CONFIDENCE &&
    rightShoulder?.score > MIN_KEYPOINT_CONFIDENCE
  ) {
    const shoulderToWrist = calculateDistance(rightWrist, rightShoulder)
    const shoulderToElbow = calculateDistance(rightElbow, rightShoulder)
    const elbowToWrist = calculateDistance(rightWrist, rightElbow)

    // Arm must be extended (wrist far from shoulder)
    // And arm must be relatively straight (not bent too much)
    const totalArmLength = shoulderToElbow + elbowToWrist
    const armExtension = totalArmLength > 0 ? shoulderToWrist / totalArmLength : 0

    if (
      shoulderToWrist > POINT_DISTANCE_THRESHOLD &&
      armExtension > 0.7 // Arm is mostly straight
    ) {
      const avgConfidence = (rightWrist.score + rightShoulder.score) / 2
      return {
        gesture: 'point',
        side: 'right',
        confidence: avgConfidence,
        distance: shoulderToWrist
      }
    }
  }

  return null
}

// ============ HISTORY TRACKING ============

export function updateGestureHistory(keypoints, previousHistory) {
  // Apply Kalman smoothing to reduce jitter
  const smoothedLeftWrist = {
    x: exponentialMovingAverage(
      keypoints[KEYPOINTS.LEFT_WRIST]?.x,
      previousHistory?.smoothedLeftWrist?.x,
      SMOOTHING_FACTOR
    ),
    y: exponentialMovingAverage(
      keypoints[KEYPOINTS.LEFT_WRIST]?.y,
      previousHistory?.smoothedLeftWrist?.y,
      SMOOTHING_FACTOR
    )
  }

  const smoothedRightWrist = {
    x: exponentialMovingAverage(
      keypoints[KEYPOINTS.RIGHT_WRIST]?.x,
      previousHistory?.smoothedRightWrist?.x,
      SMOOTHING_FACTOR
    ),
    y: exponentialMovingAverage(
      keypoints[KEYPOINTS.RIGHT_WRIST]?.y,
      previousHistory?.smoothedRightWrist?.y,
      SMOOTHING_FACTOR
    )
  }

  const smoothedNose = {
    x: exponentialMovingAverage(
      keypoints[KEYPOINTS.NOSE]?.x,
      previousHistory?.smoothedNose?.x,
      SMOOTHING_FACTOR
    ),
    y: exponentialMovingAverage(
      keypoints[KEYPOINTS.NOSE]?.y,
      previousHistory?.smoothedNose?.y,
      SMOOTHING_FACTOR
    )
  }

  return {
    smoothedLeftWrist,
    smoothedRightWrist,
    smoothedNose,
    rawKeypoints: keypoints
  }
}

// ============ GESTURE STATE MACHINE ============

export function validateGestureSequence(detections, requiredConfidence = MIN_SUSTAINED_CONFIDENCE) {
  // Must have N consecutive detections of same gesture
  if (detections.length < GESTURE_CONFIRMATION_FRAMES) return null

  // Get most recent detections
  const recentDetections = detections.slice(-GESTURE_CONFIRMATION_FRAMES)

  // Check if all are same gesture
  const gesture = recentDetections[0]?.gesture
  const side = recentDetections[0]?.side

  const allSame = recentDetections.every(
    d => d && d.gesture === gesture && (d.side === side || !side)
  )

  if (!allSame) return null

  // Check if all have good confidence
  const allConfident = recentDetections.every(
    d => d && d.confidence >= requiredConfidence
  )

  if (!allConfident) return null

  // Average the velocities/distances
  const avgConfidence =
    recentDetections.reduce((sum, d) => sum + (d?.confidence || 0), 0) /
    recentDetections.length

  return {
    gesture,
    side: side || null,
    confidence: avgConfidence,
    confirmed: true
  }
}

export const GESTURE_CONFIG = {
  COOLDOWN: GESTURE_COOLDOWN,
  CONFIRMATION_FRAMES: GESTURE_CONFIRMATION_FRAMES,
  WAVE_VELOCITY_THRESHOLD,
  NOD_VELOCITY_THRESHOLD,
  POINT_DISTANCE_THRESHOLD
}
