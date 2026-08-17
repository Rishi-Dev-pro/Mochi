/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LipSyncAnalyzer } from '../src/lipsync/lipSyncAnalyzer'
import { LipSyncController } from '../src/lipsync/lipSyncController'
import { LipSyncManager } from '../src/lipsync/lipSyncManager'
import { LIP_SYNC_CONFIG } from '../src/lipsync/lipSyncConfig'

describe('VRM Lip-Sync & Emotion Synchronization Suite (Milestone 4)', () => {
  let analyzer
  let controller
  let manager

  beforeEach(() => {
    analyzer = new LipSyncAnalyzer()
    controller = new LipSyncController()
    manager = new LipSyncManager()
  })

  describe('LipSyncAnalyzer (RMS Openness & Spectral Vowels)', () => {
    it('returns 0.0 openness for silent audio samples', () => {
      const silentBuffer = new Float32Array(512).fill(0)
      const openness = analyzer.calculateMouthOpenness(silentBuffer)
      expect(openness).toBe(0.0)
    })

    it('returns 0.0 openness when audio energy is below silenceThreshold', () => {
      const subThresholdBuffer = new Float32Array(512).fill(LIP_SYNC_CONFIG.silenceThreshold * 0.5)
      const openness = analyzer.calculateMouthOpenness(subThresholdBuffer)
      expect(openness).toBe(0.0)
    })

    it('calculates increasing mouth openness with higher acoustic audio energy', () => {
      const lowEnergy = new Float32Array(512).fill(0.08)
      const medEnergy = new Float32Array(512).fill(0.20)
      const highEnergy = new Float32Array(512).fill(0.45)

      const lowOpen = analyzer.calculateMouthOpenness(lowEnergy)
      const medOpen = analyzer.calculateMouthOpenness(medEnergy)
      const highOpen = analyzer.calculateMouthOpenness(highEnergy)

      expect(lowOpen).toBeGreaterThan(0.0)
      expect(medOpen).toBeGreaterThan(lowOpen)
      expect(highOpen).toBeGreaterThan(medOpen)
      expect(highOpen).toBeLessThanOrEqual(LIP_SYNC_CONFIG.maxOpenness)
    })

    it('estimates valid vowel distribution from FFT frequency data', () => {
      const freqBuffer = new Uint8Array(256)
      // Populate mid-frequency band (800-2400Hz) to simulate "AA" vowel
      for (let i = 10; i < 40; i++) {
        freqBuffer[i] = 180
      }

      const vowels = analyzer.estimateVowelDistribution(freqBuffer, 22050, 512)

      expect(vowels).toHaveProperty('aa')
      expect(vowels).toHaveProperty('ih')
      expect(vowels).toHaveProperty('ou')
      expect(vowels).toHaveProperty('ee')
      expect(vowels).toHaveProperty('oh')

      for (const name of LIP_SYNC_CONFIG.morphNames) {
        expect(vowels[name]).toBeGreaterThanOrEqual(0.0)
        expect(vowels[name]).toBeLessThanOrEqual(1.0)
        expect(Number.isNaN(vowels[name])).toBe(false)
      }

      // Sum of distribution ratios should be normalized (~1.0)
      const totalWeight = Object.values(vowels).reduce((a, b) => a + b, 0)
      expect(totalWeight).toBeCloseTo(1.0, 2)
    })

    it('handles empty or null analyser gracefully without crashing', () => {
      const resNull = analyzer.analyze(null)
      expect(resNull.openness).toBe(0.0)
      expect(resNull.isSilent).toBe(true)

      const resZero = analyzer.calculateMouthOpenness(null)
      expect(resZero).toBe(0.0)
    })
  })

  describe('LipSyncController (Temporal Smoothing & Coarticulation)', () => {
    it('initializes with all morph weights and openness at 0.0', () => {
      const weights = controller.getWeights()
      expect(weights.openness).toBe(0.0)
      expect(weights.aa).toBe(0.0)
      expect(weights.ee).toBe(0.0)
      expect(weights.ih).toBe(0.0)
      expect(weights.oh).toBe(0.0)
      expect(weights.ou).toBe(0.0)
    })

    it('smooths sudden target jump without instantly snapping to 1.0', () => {
      const suddenTarget = {
        openness: 0.9,
        vowels: { aa: 0.8, ih: 0.1, ou: 0.0, ee: 0.1, oh: 0.0 },
        isSilent: false
      }

      // Step 1: 16ms frame delta
      const step1 = controller.update(suddenTarget, 0.016)
      expect(step1.openness).toBeGreaterThan(0.0)
      expect(step1.openness).toBeLessThan(0.9)
      expect(step1.aa).toBeGreaterThan(0.0)
      expect(step1.aa).toBeLessThan(0.9)

      // Step 2: Continuous smoothing converges towards target
      const step2 = controller.update(suddenTarget, 0.016)
      expect(step2.openness).toBeGreaterThan(step1.openness)
      expect(step2.aa).toBeGreaterThan(step1.aa)
    })

    it('strictly clamps all morph target weights between 0.0 and 1.0', () => {
      const extremeTarget = {
        openness: 1.5,
        vowels: { aa: 2.0, ih: -0.5, ou: 1.2, ee: 0.8, oh: 0.4 },
        isSilent: false
      }

      const result = controller.update(extremeTarget, 0.05)
      for (const name of LIP_SYNC_CONFIG.morphNames) {
        expect(result[name]).toBeGreaterThanOrEqual(0.0)
        expect(result[name]).toBeLessThanOrEqual(1.0)
      }
    })

    it('resets all morphs to 0.0 immediately on reset()', () => {
      controller.currentOpenness = 0.85
      controller.currentWeights.aa = 0.7
      controller.currentWeights.ee = 0.3

      controller.reset()
      const weights = controller.getWeights()

      expect(weights.openness).toBe(0.0)
      expect(weights.aa).toBe(0.0)
      expect(weights.ee).toBe(0.0)
      expect(weights.ih).toBe(0.0)
      expect(weights.oh).toBe(0.0)
      expect(weights.ou).toBe(0.0)
    })
  })

  describe('LipSyncManager & VRM Emotion Coexistence', () => {
    it('applies mouth morph weights additively without overriding base emotion expression', () => {
      const mockExpressions = new Map()
      const mockVRM = {
        expressionManager: {
          setValue: vi.fn((name, val) => mockExpressions.set(name, val)),
          getValue: vi.fn((name) => mockExpressions.get(name) || 0)
        }
      }

      // 1. Base emotion is happy: 1.0
      mockExpressions.set('happy', 1.0)
      mockExpressions.set('blink', 0.0)

      // 2. Apply mouth lip-sync
      const lipWeights = { aa: 0.65, ee: 0.15, ih: 0.0, oh: 0.0, ou: 0.0, openness: 0.7 }
      manager.applyToVRM(mockVRM, lipWeights)

      // Happy emotion is preserved
      expect(mockExpressions.get('happy')).toBe(1.0)

      // Mouth morphs are applied
      expect(mockVRM.expressionManager.setValue).toHaveBeenCalledWith('aa', 0.65)
      expect(mockVRM.expressionManager.setValue).toHaveBeenCalledWith('ee', 0.15)
    })

    it('stops lip-sync cleanly on stop()', () => {
      manager.isActive = true
      manager.lastWeights = { aa: 0.5, ih: 0.1, ou: 0.0, ee: 0.2, oh: 0.0, openness: 0.6 }

      manager.stop()
      expect(manager.isActive).toBe(false)
      expect(manager.lastWeights.openness).toBe(0.0)
      expect(manager.lastWeights.aa).toBe(0.0)
    })
  })
})
