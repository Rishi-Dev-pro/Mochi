import { useRef } from 'react'
import { useThreeJS } from '../hooks/useThreeJS'
import './MochiCharacter.css'

export default function MochiCharacter() {
  const containerRef = useRef(null)
  useThreeJS(containerRef)

  return (
    <div className="mochi-container">
      <div className="three-canvas" ref={containerRef} />
      <div className="canvas-overlay">
        <p>🌙 Mochi 3D Character</p>
        <small>Interactive 3D placeholder</small>
      </div>
    </div>
  )
}
