import { useState, useEffect } from 'react'
import MochiCharacter from '../components/MochiCharacter'
import { useGestureDetection } from '../hooks/useGestureDetection'

export default function HomePage() {
  const { lastGesture } = useGestureDetection()
  const [mochiReaction, setMochiReaction] = useState(null)

  useEffect(() => {
    if (!lastGesture) return

    // Mochi reacts to gesture
    const reactions = {
      wave: ["👋 Hey there!", "You waving at me?", "Wave back at you! 👋"],
      nod: ["I agree! 🤝", "Yes, yes! 😊", "Great idea!"],
      point: ["I see where you're pointing! 👀", "Interesting direction! 🧭", "Got it! 📍"]
    }

    const gestureReactions = reactions[lastGesture.gesture] || []
    const reaction = gestureReactions[Math.floor(Math.random() * gestureReactions.length)]
    
    setMochiReaction(reaction)

    // Clear after 3 seconds
    const timer = setTimeout(() => setMochiReaction(null), 3000)
    return () => clearTimeout(timer)
  }, [lastGesture])

  return (
    <div className="page">
      <h1>Welcome to Mochi</h1>
      <p>Your persistent 3D AI companion.</p>
      
      {mochiReaction && (
        <div className="gesture-feedback">
          <p className="reaction-text">{mochiReaction}</p>
          <p className="gesture-badge">
            Detected: {lastGesture.gesture}
          </p>
        </div>
      )}

      <MochiCharacter />
    </div>
  )
}
