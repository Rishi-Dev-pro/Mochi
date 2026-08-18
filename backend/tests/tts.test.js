import { describe, it } from 'node:test'
import assert from 'node:assert'
import { generateSpeechAudio } from '../services/ttsService.js'

describe('Backend TTS Service (Real Audio Generation)', () => {
  it('generates a valid binary audio buffer with audio header', async () => {
    const audioBuffer = await generateSpeechAudio('Hello Mochi companion!')

    assert.ok(Buffer.isBuffer(audioBuffer), 'Output must be a binary Buffer')
    assert.ok(audioBuffer.length > 44, 'Buffer must contain header and audio data')

    // Audio buffer must start with either RIFF (WAV), ID3 (MP3 tag), or MPEG frame sync (0xFF)
    const isWav = audioBuffer.subarray(0, 4).toString('ascii') === 'RIFF'
    const isMp3Id3 = audioBuffer.subarray(0, 3).toString('ascii') === 'ID3'
    const isMp3Sync = audioBuffer[0] === 0xff

    assert.ok(isWav || isMp3Id3 || isMp3Sync, 'Audio buffer must be valid WAV or MP3 stream')
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
