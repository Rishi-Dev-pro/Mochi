import { useState, useEffect } from 'react'
import MochiCharacter from '../components/MochiCharacter'
import { useGestureDetection } from '../hooks/useGestureDetection'
import { useEmotionStore } from '../store/useEmotionStore'
import '../styles/emotion-display.css'

export default function HomePage() {
  const { lastGesture } = useGestureDetection()
  const emotionStore = useEmotionStore()
  const [mochiReaction, setMochiReaction] = useState(null)

  useEffect(() => {
    if (!lastGesture) return

    // Mochi reacts to gesture
    emotionStore.reactToGesture(lastGesture)

    const reactions = {
      wave: ["👋 Hey there!", "You waving at me?", "Wave back at you! 👋"],
      nod: ["I agree! 🤝", "Yes, yes! 😊", "Great idea!"],
      point: ["I see where you're pointing! 👀", "Interesting direction! 🧭", "Got it! 📍"]
    }

    const gestureReactions = reactions[lastGesture.gesture] || []
    const reaction = gestureReactions[Math.floor(Math.random() * gestureReactions.length)]

    setMochiReaction(reaction)

    const timer = setTimeout(() => setMochiReaction(null), 3000)
    return () => clearTimeout(timer)
  }, [lastGesture, emotionStore])

  return (
    <div className="page">
      <div className="header-with-emotion">
        <div>
          <h1>Welcome to Mochi</h1>
          <p>Your persistent 3D AI companion.</p>
        </div>

        {/* Emotion Display Badge */}
        <div
          className="emotion-badge"
          style={{ borderColor: emotionStore.getEmotionColor() }}
        >
          <div className="emotion-emoji">{emotionStore.getEmotionEmoji()}</div>
          <div className="emotion-info">
            <p className="emotion-type">{emotionStore.currentEmotion.type}</p>
            <div className="emotion-intensity">
              <div className="intensity-bar">
                <div
                  className="intensity-fill"
                  style={{
                    width: `${emotionStore.currentEmotion.intensity}%`,
                    backgroundColor: emotionStore.getEmotionColor()
                  }}
                />
              </div>
              <span>{emotionStore.currentEmotion.intensity}%</span>
            </div>
          </div>
        </div>
      </div>

      {mochiReaction && (
        <div className="gesture-feedback">
          <p className="reaction-text">{mochiReaction}</p>
          <p className="gesture-badge">
            Detected: {lastGesture.gesture}
          </p>
        </div>
      )}

      {emotionStore.currentEmotion.context && (
        <p className="emotion-context">
          💭 {emotionStore.currentEmotion.context}
        </p>
      )}

      <MochiCharacter />
    </div>
  )
}
