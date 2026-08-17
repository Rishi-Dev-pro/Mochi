/**
 * Lip-Sync Manager
 *
 * High-level coordinator connecting the Audio Engine, LipSyncAnalyzer, LipSyncController,
 * and the 3D VRM expression layer in the Three.js render loop.
 */

import { audioEngine } from '../voice/audioEngine'
import { lipSyncAnalyzer } from './lipSyncAnalyzer'
import { lipSyncController } from './lipSyncController'
import { LIP_SYNC_CONFIG } from './lipSyncConfig'

export class LipSyncManager {
  constructor(config = {}) {
    this.config = { ...LIP_SYNC_CONFIG, ...config }
    this.isActive = false
    this.lastWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0, openness: 0 }
  }

  /**
   * Main per-frame update invoked inside the Three.js render loop
   * @param {number} delta Frame delta in seconds
   * @param {VRM} vrm Active Three.js VRM instance
   * @returns {{ aa: number, ih: number, ou: number, ee: number, oh: number, openness: number }}
   */
  update(delta, vrm) {
    const isAudioPlaying = audioEngine.isPlaying && Boolean(audioEngine.analyserNode)
    const ctx = audioEngine.audioContext
    const sampleRate = ctx?.sampleRate || 22050

    let analysis = null

    if (isAudioPlaying) {
      this.isActive = true
      analysis = lipSyncAnalyzer.analyze(audioEngine.analyserNode, sampleRate)
    } else {
      this.isActive = false
      analysis = {
        openness: 0.0,
        vowels: { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 },
        isSilent: true
      }
    }

    const weights = lipSyncController.update(analysis, delta)
    this.lastWeights = weights

    // Apply mouth morphs to VRM Expression Manager
    if (vrm && vrm.expressionManager) {
      this.applyToVRM(vrm, weights)
    }

    return weights
  }

  /**
   * Apply smoothed mouth morph weights to VRM without destroying base facial emotions
   * @param {VRM} vrm
   * @param {Object} weights
   */
  applyToVRM(vrm, weights) {
    if (!vrm.expressionManager) return

    for (const morph of this.config.morphNames) {
      const lipWeight = weights[morph] || 0.0

      if (lipWeight > 0.001) {
        // Apply mouth morph weight additively with any pre-existing emotion mouth bias
        const existingVal = vrm.expressionManager.getValue(morph) || 0.0
        vrm.expressionManager.setValue(morph, Math.min(1.0, existingVal + lipWeight))
      }
    }
  }

  /**
   * Stop lip-sync and return mouth immediately to neutral
   */
  stop() {
    this.isActive = false
    lipSyncController.reset()
    this.lastWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0, openness: 0 }
  }

  /**
   * Retrieve real-time telemetry for debug HUD
   */
  getDebugInfo() {
    return {
      isActive: this.isActive,
      openness: this.lastWeights.openness,
      weights: { ...this.lastWeights }
    }
  }
}

export const lipSyncManager = new LipSyncManager()
