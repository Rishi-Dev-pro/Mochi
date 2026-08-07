import { useCloudSync } from '../context/CloudSyncContext'
import '../styles/cloud-sync.css'

export default function CloudSyncIndicator() {
  const { isCloudOnline, queuedCount, isSyncing } = useCloudSync()

  return (
    <div className="cloud-sync-indicator">
      {/* Status Dot */}
      <div className={`status-dot ${isCloudOnline ? 'online' : 'offline'}`} />

      {/* Status Text */}
      <span className="status-text">
        {isCloudOnline ? '☁️ Cloud' : '📱 Offline'}
      </span>

      {/* Queued Count */}
      {queuedCount > 0 && (
        <span className="queued-badge">{queuedCount} queued</span>
      )}

      {/* Syncing Spinner */}
      {isSyncing && (
        <span className="sync-spinner">↻</span>
      )}
    </div>
  )
}
