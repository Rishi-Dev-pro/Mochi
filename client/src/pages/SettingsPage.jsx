import { useWebcam } from '../context/WebcamContext'
import WebcamFeed from '../components/WebcamFeed'
import '../styles/minecraft-theme.css'
import '../styles/minecraft-blocks.css'
import '../styles/minecraft-buttons.css'
import '../styles/minecraft-effects.css'

export default function SettingsPage() {
  const { isEnabled, enableWebcam, disableWebcam } = useWebcam()

  return (
    <div className="minecraft-sky" style={{ padding: '24px 20px 60px 20px', minHeight: 'calc(100vh - 70px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <header className="mc-3d-block grass-block block-appear" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="pixel-font" style={{ fontSize: '0.8rem', color: 'var(--mc-sakura-light)', marginBottom: '6px' }}>
            ⚙️ COMPANION CONFIGURATION
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: '4px 0' }}>Settings</h1>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
            Configure webcam motion detection and companion preferences.
          </p>
        </header>

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

        <section className="mc-3d-block planks-block block-appear">
          <h3 style={{ marginTop: 0, color: 'var(--mc-sakura-light)' }}>🔒 Privacy & Data Notice</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>
            Your webcam feed is processed 100% locally inside your browser using MediaPipe and TensorFlow.js. 
            No video streams or raw facial images are ever transmitted to any remote servers.
          </p>
        </section>

      </div>
    </div>
  )
}
