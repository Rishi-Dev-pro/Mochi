import { useEmotionStore } from '../store/useEmotionStore'
import '../styles/emotion-display.css'

export default function EmotionDisplay() {
  const emotionStore = useEmotionStore()
  const { currentEmotion, getEmotionColor, getEmotionEmoji } = emotionStore

  return (
    <div className="emotion-display">
      <div
        className="emotion-card"
        style={{
          borderColor: getEmotionColor(),
          backgroundColor: `${getEmotionColor()}15` // 15% opacity
        }}
      >
        {/* Emoji */}
        <div className="emotion-emoji">
          {getEmotionEmoji()}
        </div>

        {/* Info Section */}
        <div className="emotion-info">
          {/* Emotion Type */}
          <p className="emotion-label">
            {currentEmotion.type}
          </p>

          {/* Intensity Bar */}
          <div className="emotion-intensity-bar">
            <div
              className="emotion-intensity-fill"
              style={{
                width: `${currentEmotion.intensity}%`,
                backgroundColor: getEmotionColor()
              }}
            />
          </div>

          {/* Percentage */}
          <p className="emotion-percentage">
            {currentEmotion.intensity}%
          </p>
        </div>
      </div>

      {/* Context - Shows below card */}
      {currentEmotion.context && (
        <div className="emotion-context-tooltip">
          💭 {currentEmotion.context}
        </div>
      )}
    </div>
  )
}
