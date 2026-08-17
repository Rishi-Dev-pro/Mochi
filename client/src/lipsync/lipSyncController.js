/**
 * Lip-Sync State Controller
 *
 * Implements smooth temporal interpolation, asymmetrical attack/release dynamics,
 * coarticulation vowel blending, and strict [0.0, 1.0] morph target weight clamping.
 */

import { LIP_SYNC_CONFIG } from './lipSyncConfig'

export class LipSyncController {
  constructor(config = {}) {
    this.config = { ...LIP_SYNC_CONFIG, ...config }

    this.currentOpenness = 0.0
    this.currentVowels = {
      aa: 0.0,
      ih: 0.0,
      ou: 0.0,
      ee: 0.0,
      oh: 0.0
    }

    this.currentWeights = {
      aa: 0.0,
      ih: 0.0,
      ou: 0.0,
      ee: 0.0,
      oh: 0.0
    }
  }

  /**
   * Update and smooth mouth morph target weights based on frame delta
   * @param {{ openness: number, vowels: Object, isSilent: boolean }} targetAnalysis
   * @param {number} delta Frame delta time in seconds (e.g. 0.016 for 60fps)
   * @returns {{ aa: number, ih: number, ou: number, ee: number, oh: number, openness: number }}
   */
  update(targetAnalysis, delta = 0.016) {
    if (!targetAnalysis) {
      this.reset()
      return this.getWeights()
    }

    const { openness: targetOpenness, vowels: targetVowels, isSilent } = targetAnalysis

    // 1. Asymmetrical Attack / Release Openness Smoothing
    const isAttacking = targetOpenness > this.currentOpenness
    const smoothingFactor = isAttacking ? this.config.attackSmoothing : this.config.releaseSmoothing

    // Time-independent smoothing factor: rate = 1 - (1 - factor)^(delta * 60)
    const normalizedRate = Math.min(1.0, 1.0 - Math.pow(1.0 - smoothingFactor, delta * 60))
    this.currentOpenness += (targetOpenness - this.currentOpenness) * normalizedRate

    if (this.currentOpenness < 0.005) {
      this.currentOpenness = 0.0
    }

    // 2. Coarticulation & Vowel Blending
    const vowelRate = Math.min(1.0, 1.0 - Math.pow(1.0 - this.config.vowelSmoothing, delta * 60))

    for (const morph of this.config.morphNames) {
      const targetVal = isSilent ? 0.0 : (targetVowels[morph] || 0.0)
      this.currentVowels[morph] += (targetVal - this.currentVowels[morph]) * vowelRate

      // 3. Compute final weighted shape: shape_weight = vowel_ratio * mouth_openness
      const finalWeight = this.currentVowels[morph] * this.currentOpenness

      // Strict clamping between 0.0 and 1.0
      this.currentWeights[morph] = Math.max(0.0, Math.min(1.0, finalWeight))
    }

    return this.getWeights()
  }

  /**
   * Reset all morph target weights and openness to 0.0 immediately
   */
  reset() {
    this.currentOpenness = 0.0
    for (const morph of this.config.morphNames) {
      this.currentVowels[morph] = 0.0
      this.currentWeights[morph] = 0.0
    }
  }

  /**
   * Get current smoothed morph weights
   * @returns {{ aa: number, ih: number, ou: number, ee: number, oh: number, openness: number }}
   */
  getWeights() {
    return {
      aa: this.currentWeights.aa,
      ih: this.currentWeights.ih,
      ou: this.currentWeights.ou,
      ee: this.currentWeights.ee,
      oh: this.currentWeights.oh,
      openness: this.currentOpenness
    }
  }
}

export const lipSyncController = new LipSyncController()
