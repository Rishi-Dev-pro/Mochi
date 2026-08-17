import { describe, it } from 'node:test'
import assert from 'node:assert'
import { generateSpeechAudio } from '../services/ttsService.js'

describe('Backend TTS Service (Real Audio Generation)', () => {
  it('generates a valid 16-bit WAV buffer with RIFF header', async () => {
    const wavBuffer = await generateSpeechAudio('Hello Mochi companion!')

    assert.ok(Buffer.isBuffer(wavBuffer), 'Output must be a binary Buffer')
    assert.ok(wavBuffer.length > 44, 'Buffer must contain header and audio data')

    // Verify WAV Header
    const riff = wavBuffer.subarray(0, 4).toString('ascii')
    const wave = wavBuffer.subarray(8, 12).toString('ascii')
    const fmt = wavBuffer.subarray(12, 16).toString('ascii')

    assert.strictEqual(riff, 'RIFF', 'Header must start with RIFF')
    assert.strictEqual(wave, 'WAVE', 'Header must contain WAVE identifier')
    assert.strictEqual(fmt, 'fmt ', 'Header must contain fmt chunk')

    // Verify PCM audio format = 1 (uncompressed PCM)
    const audioFormat = wavBuffer.readUInt16LE(20)
    assert.strictEqual(audioFormat, 1, 'Audio format must be PCM (1)')

    // Verify 1 channel (mono)
    const channels = wavBuffer.readUInt16LE(22)
    assert.strictEqual(channels, 1, 'Channel count must be 1 (mono)')

    // Verify 22050Hz sample rate
    const sampleRate = wavBuffer.readUInt32LE(24)
    assert.strictEqual(sampleRate, 22050, 'Sample rate must be 22050 Hz')

    // Verify 16 bits per sample
    const bitsPerSample = wavBuffer.readUInt16LE(34)
    assert.strictEqual(bitsPerSample, 16, 'Bits per sample must be 16')
  })

  it('rejects empty or invalid text', async () => {
    await assert.rejects(async () => {
      await generateSpeechAudio('')
    }, /Empty text payload/)

    await assert.rejects(async () => {
      await generateSpeechAudio('   ')
    }, /Empty text payload/)

    await assert.rejects(async () => {
      await generateSpeechAudio(null)
    }, /Invalid text payload/)
  })
})
