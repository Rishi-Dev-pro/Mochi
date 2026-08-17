/**
 * Lip-Sync Audio Feature Analyzer
 *
 * Extracts real-time mouth openness from time-domain RMS samples
 * and estimates vowel morph distribution (aa, ih, ou, ee, oh) from spectral FFT bands.
 *
 * Consumes the existing M3 AnalyserNode with pre-allocated buffers for zero-GC 60 FPS performance.
 */

import { LIP_SYNC_CONFIG } from './lipSyncConfig'

export class LipSyncAnalyzer {
  constructor(config = {}) {
    this.config = { ...LIP_SYNC_CONFIG, ...config }

    // Preallocated buffers for zero-allocation performance in render loop
    this.timeDataBuffer = new Float32Array(512)
    this.freqDataBuffer = new Uint8Array(256)
  }

  /**
   * Calculate mouth openness target from raw time-domain audio samples
   * @param {Float32Array} timeData
   * @returns {number} Openness target between 0.0 (closed) and 1.0 (wide open)
   */
  calculateMouthOpenness(timeData) {
    if (!timeData || timeData.length === 0) return 0.0

    // Compute Root Mean Square (RMS) energy
    let sum = 0
    for (let i = 0; i < timeData.length; i++) {
      const sample = timeData[i]
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / timeData.length)

    // Silence gating
    if (rms < this.config.silenceThreshold) {
      return 0.0
    }

    // Normalize above silence floor
    const normalized = Math.min(1.0, (rms - this.config.silenceThreshold) * 3.5)

    // Apply gamma response curve for natural mouth dynamics
    const curved = Math.pow(normalized, this.config.opennessGamma)
    return Math.max(0.0, Math.min(this.config.maxOpenness, curved))
  }

  /**
   * Estimate vowel distribution weights from spectral frequency data
   * @param {Uint8Array} freqData
   * @param {number} sampleRate (e.g. 22050 or 44100)
   * @param {number} fftSize
   * @returns {{ aa: number, ih: number, ou: number, ee: number, oh: number }}
   */
  estimateVowelDistribution(freqData, sampleRate = 22050, fftSize = 512) {
    if (!freqData || freqData.length === 0) {
      return { aa: 0.2, ih: 0.2, ou: 0.2, ee: 0.2, oh: 0.2 }
    }

    const binWidth = sampleRate / fftSize

    // Helper: sum energy across specified frequency range (Hz)
    const getBandEnergy = (minHz, maxHz) => {
      const minBin = Math.max(0, Math.floor(minHz / binWidth))
      const maxBin = Math.min(freqData.length - 1, Math.ceil(maxHz / binWidth))
      let energy = 0
      for (let b = minBin; b <= maxBin; b++) {
        energy += freqData[b]
      }
      return energy / Math.max(1, maxBin - minBin + 1)
    }

    const lowEnergy = getBandEnergy(this.config.bands.low[0], this.config.bands.low[1])   // 200 - 800 Hz
    const midEnergy = getBandEnergy(this.config.bands.mid[0], this.config.bands.mid[1])   // 800 - 2400 Hz
    const highEnergy = getBandEnergy(this.config.bands.high[0], this.config.bands.high[1]) // 2400 - 6000 Hz

    const totalEnergy = lowEnergy + midEnergy + highEnergy
    if (totalEnergy < 5) {
      // Default balanced baseline during low energy
      return { aa: 0.35, ih: 0.15, ou: 0.15, ee: 0.15, oh: 0.20 }
    }

    const lowRatio = lowEnergy / totalEnergy
    const midRatio = midEnergy / totalEnergy
    const highRatio = highEnergy / totalEnergy

    // Acoustic vowel mapping:
    // AA: strong mid-energy & broad resonance
    // EE: strong high-frequency formant (F2/F3)
    // IH: balanced mid-high frequency
    // OH: dominant low/mid-low formant
    // OU: strong low-frequency / rounded formant
    const aaWeight = midRatio * 1.35 + lowRatio * 0.2
    const eeWeight = highRatio * 1.5 + midRatio * 0.4
    const ihWeight = highRatio * 0.9 + midRatio * 0.7
    const ohWeight = lowRatio * 1.1 + midRatio * 0.5
    const ouWeight = lowRatio * 1.4 + highRatio * 0.1

    const sumWeights = aaWeight + eeWeight + ihWeight + ohWeight + ouWeight || 1.0

    return {
      aa: aaWeight / sumWeights,
      ih: ihWeight / sumWeights,
      ou: ouWeight / sumWeights,
      ee: eeWeight / sumWeights,
      oh: ohWeight / sumWeights
    }
  }

  /**
   * Main analysis execution from active AnalyserNode
   * @param {AnalyserNode|null} analyserNode
   * @param {number} sampleRate
   * @returns {{ openness: number, vowels: { aa: number, ih: number, ou: number, ee: number, oh: number }, isSilent: boolean }}
   */
  analyze(analyserNode, sampleRate = 22050) {
    if (!analyserNode) {
      return {
        openness: 0.0,
        vowels: { aa: 0.0, ih: 0.0, ou: 0.0, ee: 0.0, oh: 0.0 },
        isSilent: true
      }
    }

    // Ensure buffers match analyser size
    if (this.timeDataBuffer.length !== analyserNode.fftSize) {
      this.timeDataBuffer = new Float32Array(analyserNode.fftSize)
    }
    if (this.freqDataBuffer.length !== analyserNode.frequencyBinCount) {
      this.freqDataBuffer = new Uint8Array(analyserNode.frequencyBinCount)
    }

    analyserNode.getFloatTimeDomainData(this.timeDataBuffer)
    analyserNode.getByteFrequencyData(this.freqDataBuffer)

    const openness = this.calculateMouthOpenness(this.timeDataBuffer)
    const isSilent = openness <= 0.001

    const vowels = isSilent
      ? { aa: 0.0, ih: 0.0, ou: 0.0, ee: 0.0, oh: 0.0 }
      : this.estimateVowelDistribution(this.freqDataBuffer, sampleRate, analyserNode.fftSize)

    return { openness, vowels, isSilent }
  }
}

export const lipSyncAnalyzer = new LipSyncAnalyzer()
