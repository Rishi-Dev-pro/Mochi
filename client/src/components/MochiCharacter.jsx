import { useRef } from 'react'
import { useThreeJS } from '../hooks/useThreeJS'
import { useEmotionStore, EMOTION_TYPES, EMOTION_EMOJIS } from '../store/emotionStore'
import './MochiCharacter.css'

export default function MochiCharacter() {
  const containerRef = useRef(null)
  useThreeJS(containerRef)
  
  const currentEmotion = useEmotionStore((state) => state.currentEmotion)
  const setEmotion = useEmotionStore((state) => state.setEmotion)

  const quickEmotions = [
    { type: EMOTION_TYPES.HAPPY, label: 'Happy' },
    { type: EMOTION_TYPES.WAVING, label: 'Waving' },
    { type: EMOTION_TYPES.TEASING, label: 'Teasing' },
    { type: EMOTION_TYPES.SHOUTING, label: 'Shouting' },
    { type: EMOTION_TYPES.ANGRY, label: 'Angry' },
    { type: EMOTION_TYPES.SAD, label: 'Sad' },
    { type: EMOTION_TYPES.SURPRISED, label: 'Surprised' },
    { type: EMOTION_TYPES.CONFUSED, label: 'Confused' },
    { type: EMOTION_TYPES.SLEEPY, label: 'Sleepy' },
    { type: EMOTION_TYPES.NEUTRAL, label: 'Neutral' }
  ]

  return (
    <div className="mochi-container">
      <div className="three-canvas" ref={containerRef} />
      
      {/* Top Bar: Title Badge */}
      <div className="canvas-overlay-badge">
        <span className="character-badge-icon">🌸</span>
        <span className="character-badge-text">Mochi 3D Human Avatar</span>
      </div>

      {/* Bottom Bar: Interactive Quick Emotion Chips */}
      <div className="emotion-chips-bar">
        {quickEmotions.map((item) => {
          const isActive = currentEmotion?.type === item.type
          return (
            <button
              key={item.type}
              className={`emotion-chip ${isActive ? 'active' : ''}`}
              onClick={() => setEmotion(item.type, 90, `User clicked ${item.label}`, 'ui')}
              title={`Trigger ${item.label} Emotion`}
            >
              <span className="chip-emoji">{EMOTION_EMOJIS[item.type]}</span>
              <span className="chip-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

