/**
 * Voice → AI Bridge
 *
 * Coordinates between finalized speech-to-text transcripts and the unified Claude AI pipeline.
 * Features:
 * - Utterance deduplication (prevents duplicate requests from STT event bursts)
 * - Empty/whitespace transcript filtering
 * - Self-hearing feedback loop protection (gating during PROCESSING & MOCHI_SPEAKING)
 * - Turn ID correlation & stale response protection
 * - Conversational state coordination (LISTENING -> USER_SPEAKING -> PROCESSING -> MOCHI_SPEAKING -> LISTENING)
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
    this.currentTurnId = null
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
   * Check if an utterance is a duplicate, invalid, or blocked by self-hearing gate
   * @param {string} text
   * @param {string|number} [id]
   * @returns {boolean}
   */
  isDuplicateOrInvalid(text, id = null) {
    if (!text || typeof text !== 'string') return true

    const trimmed = text.trim()
    if (!trimmed) return true

    const store = useVoiceStore.getState()

    // Self-Hearing Gate: Discard input while Mochi is speaking or processing
    if (store.isMochiSpeaking || store.voiceState === VOICE_STATES.MOCHI_SPEAKING || store.voiceState === VOICE_STATES.PROCESSING || this.isProcessing) {
      return true
    }

    const now = Date.now()

    // Check specific utterance ID if provided
    if (id && this.processedUtterances.has(id)) {
      return true
    }

    // Check rapid duplicate event burst within a 1.2-second window
    if (
      trimmed.toLowerCase() === this.lastProcessedText.toLowerCase() &&
      now - this.lastProcessedTimestamp < 1200
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
    const turnId = `turn-${now}-${Math.random().toString(36).substr(2, 6)}`
    this.currentTurnId = turnId

    // Mark as processed
    if (utteranceId) {
      this.processedUtterances.add(utteranceId)
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
      store.setVoiceState(VOICE_STATES.PROCESSING)

      // Send through the unified AI messaging pipeline tagged with turnId
      await this.sendHandler(trimmed, turnId)

      // Turn response handled asynchronously by useClaude -> ttsService
      return true
    } catch (error) {
      console.error('[VoiceAiBridge] Error processing voice transcript with AI:', error)
      const currentStore = useVoiceStore.getState()
      if (currentStore.voiceMode) {
        currentStore.setVoiceState(VOICE_STATES.ERROR)

        // Auto-recover back to LISTENING after short delay
        setTimeout(() => {
          if (useVoiceStore.getState().voiceMode && useVoiceStore.getState().voiceState === VOICE_STATES.ERROR) {
            useVoiceStore.getState().setVoiceState(VOICE_STATES.LISTENING)
          }
        }, 1200)
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
    this.currentTurnId = null
  }
}

export const voiceAiBridge = new VoiceAiBridge()
