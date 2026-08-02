import { useWebcam } from '../context/WebcamContext'
import WebcamFeed from '../components/WebcamFeed'
import '../styles/settings.css'

export default function SettingsPage() {
  const { isEnabled, enableWebcam, disableWebcam } = useWebcam()

  return (
    <div className="page settings-page">
      <h1>Settings</h1>
      
      <div className="settings-section">
        <h2>Webcam & Motion Detection</h2>
        
        {!isEnabled ? (
          <button onClick={enableWebcam} className="btn-primary">
            🎥 Enable Webcam
          </button>
        ) : (
          <button onClick={disableWebcam} className="btn-danger">
            🚫 Disable Webcam
          </button>
        )}

        {isEnabled && <WebcamFeed />}
      </div>

      <div className="settings-section">
        <h3>Privacy Notice</h3>
        <p>
          Your webcam stream is processed locally in your browser. 
          No video data is sent to servers.
        </p>
      </div>
    </div>
  )
}
