import { useRef } from 'react'
import { useThreeJS } from '../hooks/useThreeJS'
import './MochiCharacter.css'

export default function MochiCharacter() {
  const containerRef = useRef(null)
  useThreeJS(containerRef)

  return (
    <div className="mochi-container" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px' }}>
      <div className="three-canvas" ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '380px' }} />
      <div className="canvas-overlay" style={{
        position: 'absolute',
        bottom: '14px',
        right: '14px',
        background: 'rgba(24, 16, 28, 0.82)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--mc-sakura-glow)',
        borderRadius: '20px',
        padding: '6px 14px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.85rem',
        fontFamily: "'Minecraftia', monospace",
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}>
        <span>🌱 Chubby Mochi 3D</span>
      </div>
    </div>
  )
}
