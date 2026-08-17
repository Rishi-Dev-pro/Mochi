import { useWebcam } from '../context/WebcamContext'
import { useVoiceStore } from '../store/useVoiceStore'
import WebcamFeed from '../components/WebcamFeed'
import VoiceController from '../components/VoiceController'
import '../styles/minecraft-theme.css'
import '../styles/minecraft-blocks.css'
import '../styles/minecraft-buttons.css'
import '../styles/minecraft-effects.css'

export default function SettingsPage() {
  const { isEnabled, enableWebcam, disableWebcam } = useWebcam()
  const { config, updateConfig } = useVoiceStore()

  const handleSpeechThresholdChange = (e) => {
    updateConfig({ speechThreshold: parseFloat(e.target.value) })
  }

  const handleSilenceDelayChange = (e) => {
    updateConfig({ silenceEndDelayMs: parseInt(e.target.value, 10) })
  }

  return (
    <div className="minecraft-sky" style={{ padding: '24px 20px 60px 20px', minHeight: 'calc(100vh - 70px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <header className="mc-3d-block grass-block block-appear" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="pixel-font" style={{ fontSize: '0.8rem', color: 'var(--mc-sakura-light)', marginBottom: '6px' }}>
            ⚙️ COMPANION CONFIGURATION
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: '4px 0' }}>Settings</h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
            Configure voice activity detection, webcam motion tracking, and companion preferences.
          </p>
        </header>

        {/* Voice Subsystem Configuration */}
        <section className="mc-3d-block stone-block block-appear" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎤 Hands-Free Voice & VAD Settings
          </h2>
          
          <VoiceController />

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.9rem', color: '#ffb7c5', fontWeight: 600 }}>
                  Speech Detection Sensitivity (Threshold: {config.speechThreshold.toFixed(3)})
                </label>
                <span className="pixel-font" style={{ fontSize: '0.8rem', color: 'var(--mc-gold)' }}>
                  {config.speechThreshold < 0.02 ? 'High Sensitivity' : config.speechThreshold > 0.05 ? 'Low Sensitivity' : 'Normal'}
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.08"
                step="0.005"
                value={config.speechThreshold}
                onChange={handleSpeechThresholdChange}
                style={{ width: '100%', accentColor: '#ff85a2' }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Lower values detect quieter speech; higher values reduce sensitivity to background noise.
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.9rem', color: '#ffb7c5', fontWeight: 600 }}>
                  Silence Hold Delay ({config.silenceEndDelayMs}ms)
                </label>
                <span className="pixel-font" style={{ fontSize: '0.8rem', color: 'var(--mc-gold)' }}>
                  {(config.silenceEndDelayMs / 1000).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="600"
                max="2500"
                step="100"
                value={config.silenceEndDelayMs}
                onChange={handleSilenceDelayChange}
                style={{ width: '100%', accentColor: '#ff85a2' }}
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Duration of silence required before completing an utterance.
              </p>
            </div>
          </div>
        </section>

        {/* Webcam Configuration */}
        <section className="mc-3d-block dirt-block block-appear" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎥 Webcam & Motion Detection
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            {!isEnabled ? (
              <button onClick={enableWebcam} className="btn-primary btn-lg">
                🎥 Enable Webcam Detection
              </button>
            ) : (
              <button onClick={disableWebcam} className="btn-danger btn-lg">
                🚫 Disable Webcam Detection
              </button>
            )}
          </div>

          {isEnabled && (
            <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255, 183, 197, 0.3)' }}>
              <WebcamFeed />
            </div>
          )}
        </section>

        {/* Privacy Notice */}
        <section className="mc-3d-block planks-block block-appear">
          <h3 style={{ marginTop: 0, color: 'var(--mc-sakura-light)' }}>🔒 Privacy & Data Notice</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>
            Both your webcam video and microphone audio are processed <strong>100% locally inside your browser</strong> using Web Audio API, MediaPipe, and Web Speech API. 
            No raw audio streams or camera feeds are ever stored, recorded, or transmitted to any remote servers or databases.
          </p>
        </section>

      </div>
    </div>
  )
}

