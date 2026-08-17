/**
 * Voice → AI Bridge
 *
 * Coordinates between finalized speech-to-text transcripts and the unified Claude AI pipeline.
 * Features:
 * - Utterance deduplication (prevents duplicate requests from STT event bursts)
 * - Empty/whitespace transcript filtering
 * - AI state coordination (THINKING -> RESPONDING -> LISTENING)
 * - Decoupled integration with the chat messaging engine
 */

import { VOICE_STATES } from './config'
import { useVoiceStore } from '../store/useVoiceStore'

export class VoiceAiBridge {
  constructor() {
    this.sendHandler = null
    this.processedUtterances = new Set()
    this.lastProcessedText = ''
    this.lastProcessedTimestamp = 0
    this.isProcessing = false
  }

  /**
   * Register the message sending handler (e.g. from useClaude)
   * @param {Function} handler
   */
  registerSendHandler(handler) {
    this.sendHandler = handler
  }

  /**
   * Unregister the sending handler
   */
  unregisterSendHandler() {
    this.sendHandler = null
  }

  /**
   * Check if an utterance is a duplicate or invalid
   * @param {string} text
   * @param {string|number} [id]
   * @returns {boolean}
   */
  isDuplicateOrInvalid(text, id = null) {
    if (!text || typeof text !== 'string') return true

    const trimmed = text.trim()
    if (!trimmed) return true

    const now = Date.now()

    // Check specific utterance ID if provided
    if (id && this.processedUtterances.has(id)) {
      return true
    }

    // Check recent duplicate text within a 3-second window
    if (
      trimmed.toLowerCase() === this.lastProcessedText.toLowerCase() &&
      now - this.lastProcessedTimestamp < 3000
    ) {
      return true
    }

    return false
  }

  /**
   * Process a finalized transcript utterance through the AI pipeline
   * @param {string} transcript
   * @param {string|number} [utteranceId]
   * @returns {Promise<boolean>} returns true if submitted, false if ignored/duplicate
   */
  async processUtterance(transcript, utteranceId = null) {
    if (this.isDuplicateOrInvalid(transcript, utteranceId)) {
      return false
    }

    const trimmed = transcript.trim()
    const now = Date.now()

    // Mark as processed
    if (utteranceId) {
      this.processedUtterances.add(utteranceId)
      // Limit memory size of processed utterances set
      if (this.processedUtterances.size > 100) {
        const firstEntry = this.processedUtterances.values().next().value
        this.processedUtterances.delete(firstEntry)
      }
    }

    this.lastProcessedText = trimmed
    this.lastProcessedTimestamp = now

    if (!this.sendHandler) {
      console.warn('[VoiceAiBridge] No send handler registered. Transcript logged but not sent to AI.')
      return false
    }

    this.isProcessing = true
    const store = useVoiceStore.getState()

    try {
      store.setVoiceState(VOICE_STATES.THINKING)

      // Send through the unified AI messaging pipeline
      await this.sendHandler(trimmed)

      // Transition to RESPONDING
      if (useVoiceStore.getState().voiceMode) {
        useVoiceStore.getState().setVoiceState(VOICE_STATES.RESPONDING)

        // Return to LISTENING after short duration for seamless continuous voice mode
        setTimeout(() => {
          const currentStore = useVoiceStore.getState()
          if (
            currentStore.voiceMode &&
            (currentStore.voiceState === VOICE_STATES.RESPONDING || currentStore.voiceState === VOICE_STATES.THINKING)
          ) {
            currentStore.setVoiceState(VOICE_STATES.LISTENING)
          }
        }, 1000)
      }

      return true
    } catch (error) {
      console.error('[VoiceAiBridge] Error processing voice transcript with AI:', error)
      const currentStore = useVoiceStore.getState()
      if (currentStore.voiceMode) {
        currentStore.setVoiceState(VOICE_STATES.ERROR)
      }
      return false
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Reset processed caches and processing flag
   */
  reset() {
    this.processedUtterances.clear()
    this.lastProcessedText = ''
    this.lastProcessedTimestamp = 0
    this.isProcessing = false
  }
}

export const voiceAiBridge = new VoiceAiBridge()
