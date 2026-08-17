/**
 * Lip-Sync Subsystem Configuration & Default Thresholds
 */

export const LIP_SYNC_CONFIG = {
  // RMS audio energy below which the mouth is considered silent and closed
  silenceThreshold: 0.025,

  // Maximum mouth openness weight cap (0.0 to 1.0)
  maxOpenness: 0.95,

  // Gamma curve for non-linear mouth openness mapping (higher = more subtle at low volume)
  opennessGamma: 1.35,

  // Attack and release smoothing factors for mouth openness (0.0 to 1.0)
  attackSmoothing: 0.45,   // Fast response to speech onset
  releaseSmoothing: 0.22,  // Smooth natural decay on silence

  // Vowel shape transition smoothing factor
  vowelSmoothing: 0.30,

  // Frequency bands (in Hz) for spectral vowel approximation
  // Based on standard acoustic formant ranges:
  // Low (F1 base / vowels like OO, OH): 200 - 800 Hz
  // Mid (F1/F2 region / vowels like AA, AH): 800 - 2400 Hz
  // High (F2/F3 region / vowels like EE, IH): 2400 - 6000 Hz
  bands: {
    low: [200, 800],
    mid: [800, 2400],
    high: [2400, 6000]
  },

  // Supported VRM mouth morph names
  morphNames: ['aa', 'ih', 'ou', 'ee', 'oh']
}
