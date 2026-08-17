/**
 * Microphone Manager
 *
 * Manages acquisition, lifetime, permissions, and safe cleanup of MediaStream audio tracks.
 * Guarantees no duplicate streams and no leaked microphone hardware resources.
 */

import { PERMISSION_STATES } from './config'

export class MicrophoneManager {
  constructor() {
    this.stream = null
    this.permissionState = PERMISSION_STATES.IDLE
    this.listeners = new Set()
  }

  /**
   * Subscribe to microphone status changes
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback)
    callback({
      permissionState: this.permissionState,
      isActive: this.isActive(),
      stream: this.stream
    })
    return () => this.listeners.delete(callback)
  }

  notify() {
    const payload = {
      permissionState: this.permissionState,
      isActive: this.isActive(),
      stream: this.stream
    }
    for (const listener of this.listeners) {
      try {
        listener(payload)
      } catch (err) {
        console.error('[MicrophoneManager] Listener error:', err)
      }
    }
  }

  /**
   * Check if browser mediaDevices API is supported
   */
  isSupported() {
    return typeof navigator !== 'undefined' && !!(navigator?.mediaDevices?.getUserMedia)
  }


  /**
   * Request microphone stream with audio enhancements
   * @returns {Promise<MediaStream>}
   */
  async startCapture() {
    if (!this.isSupported()) {
      this.permissionState = PERMISSION_STATES.UNSUPPORTED
      this.notify()
      throw new Error('Microphone access is not supported in this browser environment.')
    }

    // If stream is already active and tracks are live, reuse safely
    if (this.stream && this.stream.active) {
      const audioTracks = this.stream.getAudioTracks()
      if (audioTracks.some((t) => t.readyState === 'live')) {
        return this.stream
      }
    }

    // Stop any stale tracks before requesting new stream
    this.stopCapture()

    this.permissionState = PERMISSION_STATES.REQUESTING
    this.notify()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        },
        video: false
      })

      this.stream = stream
      this.permissionState = PERMISSION_STATES.GRANTED

      // Listen for unexpected track ending (e.g. mic unplugged or OS permission revoked)
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.onended = () => {
          this.stopCapture()
        }
      }

      this.notify()
      return stream
    } catch (error) {
      console.warn('[MicrophoneManager] getUserMedia failed:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.permissionState = PERMISSION_STATES.DENIED
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        this.permissionState = PERMISSION_STATES.ERROR
      } else {
        this.permissionState = PERMISSION_STATES.ERROR
      }
      this.notify()
      throw error
    }
  }

  /**
   * Safely stops and disposes all active audio tracks
   */
  stopCapture() {
    if (this.stream) {
      try {
        const tracks = this.stream.getTracks()
        for (const track of tracks) {
          track.stop()
        }
      } catch (err) {
        console.warn('[MicrophoneManager] Error stopping tracks:', err)
      }
      this.stream = null
    }

    if (this.permissionState === PERMISSION_STATES.GRANTED || this.permissionState === PERMISSION_STATES.REQUESTING) {
      this.permissionState = PERMISSION_STATES.IDLE
    }

    this.notify()
  }

  /**
   * Returns true if there is an active live stream
   */
  isActive() {
    if (!this.stream || !this.stream.active) return false
    const tracks = this.stream.getAudioTracks()
    return tracks.some((t) => t.readyState === 'live')
  }

  /**
   * Get current active MediaStream or null
   */
  getStream() {
    return this.stream
  }

  /**
   * Get current permission state
   */
  getPermissionState() {
    return this.permissionState
  }
}

export const microphoneManager = new MicrophoneManager()
