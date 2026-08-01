import React from 'react'
import WebcamFeed from '../components/WebcamFeed'

export default function SettingsPage() {
  return (
    <div className="page">
      <h1>Settings</h1>
      <p>Customize Mochi's behavior and permissions.</p>

      <WebcamFeed />

      <div className="settings-section">
        <h3>General Settings</h3>
        <p>More settings coming soon...</p>
      </div>
    </div>
  )
}
