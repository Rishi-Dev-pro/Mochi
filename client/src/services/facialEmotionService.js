import * as faceapi from 'face-api.js'

// ============ EMOTION DETECTION SERVICE ============

// Map face-api emotion labels to our emotion types
const EMOTION_MAP = {
  happy: 'happy',
  sad: 'concerned',
  angry: 'angry',
  surprised: 'excited',
  neutral: 'neutral',
  fearful: 'concerned',
  disgusted: 'concerned'
}

// Emotion emojis
const EMOTION_EMOJIS = {
  happy: '😊',
  concerned: '😟',
  angry: '😠',
  excited: '🎉',
  neutral: '😐'
}

// Confidence threshold (0-1)
const MIN_EMOTION_CONFIDENCE = 0.5

// Smoothing factor for emotion transitions (0-1, lower = smoother)
const EMOTION_SMOOTHING = 0.2

export class FacialEmotionDetector {
  constructor() {
    this.isModelLoaded = false
    this.lastEmotion = null
    this.emotionHistory = []
  }

  // Initialize face-api.js models
  async initialize() {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ])

      this.isModelLoaded = true
      console.log('✅ Facial emotion models loaded')
      return true
    } catch (error) {
      console.error('❌ Failed to load facial emotion models:', error)
      return false
    }
  }

  // Detect emotion from video element
  async detectEmotionFromVideo(videoElement) {
    if (!this.isModelLoaded || !videoElement) return null

    try {
      // Run face detection with expressions
      const detections = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()

      if (!detections) return null

      // Get expressions from detection
      const expressions = detections.expressions

      // Find dominant emotion
      let dominantEmotion = 'neutral'
      let maxConfidence = 0

      for (const [emotion, confidence] of Object.entries(expressions)) {
        if (confidence > maxConfidence) {
          maxConfidence = confidence
          dominantEmotion = emotion
        }
      }

      // Only return if confidence is high enough
      if (maxConfidence < MIN_EMOTION_CONFIDENCE) {
        return { emotion: 'neutral', confidence: 0, raw: expressions }
      }

      // Map to our emotion types
      const mappedEmotion = EMOTION_MAP[dominantEmotion] || 'neutral'

      return {
        emotion: mappedEmotion,
        confidence: maxConfidence,
        rawEmotion: dominantEmotion,
        raw: expressions,
        allExpressions: expressions
      }
    } catch (error) {
      console.error('Emotion detection error:', error)
      return null
    }
  }

  // Smooth emotion transitions
  smoothEmotion(newEmotion) {
    if (!this.lastEmotion) {
      this.lastEmotion = newEmotion
      return newEmotion
    }

    // Only smooth if emotion type is different
    if (newEmotion.emotion !== this.lastEmotion.emotion) {
      // New emotion detected, update
      this.lastEmotion = newEmotion
      this.emotionHistory.push(newEmotion)
      if (this.emotionHistory.length > 30) {
        this.emotionHistory.shift()
      }
      return newEmotion
    }

    // Same emotion, smooth confidence
    const smoothedConfidence =
      this.lastEmotion.confidence * (1 - EMOTION_SMOOTHING) +
      newEmotion.confidence * EMOTION_SMOOTHING

    return {
      ...newEmotion,
      confidence: smoothedConfidence
    }
  }

  // Convert confidence to intensity (0-100)
  confidenceToIntensity(confidence) {
    return Math.round(confidence * 100)
  }

  // Get context string
  getEmotionContext(emotion, confidence) {
    const contexts = {
      happy: [
        'Detected smile 😊',
        'You look happy!',
        'Smiling detected',
        'Joyful expression'
      ],
      concerned: [
        'Detected sad expression 😟',
        'You look concerned',
        'Worried look',
        'Frowning detected'
      ],
      angry: [
        'Detected angry expression 😠',
        'Intense look detected',
        'Frowning detected',
        'Angry expression'
      ],
      excited: [
        'Detected surprise! 🎉',
        'Surprised expression',
        'Eyes wide open',
        'Astonished look'
      ],
      neutral: [
        'Neutral expression 😐',
        'Calm and composed',
        'No strong emotion',
        'Thinking...'
      ]
    }

    const contextList = contexts[emotion] || contexts['neutral']
    return contextList[Math.floor(Math.random() * contextList.length)]
  }

  // Get emotion emoji
  getEmotionEmoji(emotion) {
    return EMOTION_EMOJIS[emotion] || '😐'
  }

  // Reset detector
  reset() {
    this.lastEmotion = null
    this.emotionHistory = []
  }
}

// Singleton instance
let detectorInstance = null

export function getFacialEmotionDetector() {
  if (!detectorInstance) {
    detectorInstance = new FacialEmotionDetector()
  }
  return detectorInstance
}
