/**
 * Voice Subsystem Configuration & Default Thresholds
 *
 * All parameters are fully configurable and can be tuned or calibrated.
 */

export const VAD_CONFIG = {
  // RMS audio energy threshold to consider as potential speech
  // Normal quiet room: 0.005 - 0.015. Speech: 0.03 - 0.25
  speechThreshold: 0.03,

  // Silence threshold below which audio is considered quiet/silent
  silenceThreshold: 0.015,

  // Minimum duration of sustained audio above speechThreshold (ms) to trigger SPEECH_STARTED
  // Prevents momentary clicks, coughs, keypresses from triggering false speech starts
  speechStartDelayMs: 150,

  // Duration of sustained silence (ms) after speech before triggering SPEECH_ENDED
  // Allows natural pauses between words/phrases without abruptly cutting off the utterance
  silenceEndDelayMs: 1200,

  // Minimum duration of active speech (ms) required to qualify as a valid utterance
  minimumSpeechDurationMs: 350,

  // Fast Fourier Transform size for the Web Audio AnalyserNode
  fftSize: 512,

  // Smoothing constant for AnalyserNode frequency data (0.0 to 1.0)
  smoothingTimeConstant: 0.75,

  // Audio energy decay factor for smooth UI visualizer response
  levelDecay: 0.85,

  // Initial noise floor calibration sample count
  calibrationSamples: 30
}

export const STT_CONFIG = {
  // Preferred language for speech recognition
  lang: 'en-US',

  // Enable real-time interim results
  interimResults: true,

  // Keep recognition continuously active
  continuous: true,

  // Maximum consecutive speech recognition errors allowed before switching to ERROR state
  maxConsecutiveErrors: 4,

  // Restart delay in ms if recognition ends unexpectedly while voice mode is still active
  restartDelayMs: 300
}

export const TTS_CONFIG = {
  // Voice output volume (0.0 to 1.0)
  volume: 1.0,

  // Speech rate speed (0.5 to 2.0, default 1.0)
  rate: 1.05,

  // Speech pitch (0.5 to 2.0, default 1.1 for cute, warm companion tone)
  pitch: 1.15,

  // Preferred language for speech synthesis
  lang: 'en-US',

  // Exponential decay smoothing factor for output audio amplitude (0.0 to 1.0)
  amplitudeSmoothing: 0.65,

  // Fast Fourier Transform size for the TTS AnalyserNode
  fftSize: 512,

  // Smoothing constant for AnalyserNode frequency data
  smoothingTimeConstant: 0.8,

  // Minimum normalized amplitude to consider active speech energy
  minAmplitude: 0.02,

  // Maximum scale normalization cap
  maxAmplitude: 1.0
}

export const TTS_STATES = {
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',
  SPEAKING: 'SPEAKING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  STOPPING: 'STOPPING',
  ERROR: 'ERROR'
}

export const VOICE_STATES = {
  IDLE: 'IDLE',
  REQUESTING_PERMISSION: 'REQUESTING_PERMISSION',
  READY: 'READY',
  LISTENING: 'LISTENING',
  USER_SPEAKING: 'USER_SPEAKING',
  SPEECH_STARTED: 'USER_SPEAKING', // Alias
  TRANSCRIBING: 'USER_SPEAKING',   // Alias
  PROCESSING: 'PROCESSING',
  THINKING: 'PROCESSING',         // Alias
  MOCHI_SPEAKING: 'MOCHI_SPEAKING',
  RESPONDING: 'MOCHI_SPEAKING',   // Alias
  SPEECH_ENDED: 'PROCESSING',     // Alias
  ERROR: 'ERROR',
  STOPPING: 'STOPPING'
}

export const PERMISSION_STATES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
  ERROR: 'error'
}


