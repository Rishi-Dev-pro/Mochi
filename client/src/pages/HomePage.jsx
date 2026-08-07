import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmotionStore } from '../store/useEmotionStore'
import MochiCharacter from '../components/MochiCharacter'
import { useGestureDetection } from '../hooks/useGestureDetection'
import '../styles/minecraft-theme.css'
import '../styles/minecraft-blocks.css'
import '../styles/minecraft-buttons.css'
import '../styles/minecraft-effects.css'

export default function HomePage() {
  const navigate = useNavigate()
  const emotionStore = useEmotionStore()
  const { lastGesture } = useGestureDetection()
  const [showPose, setShowPose] = useState(false)
  const [mochiReaction, setMochiReaction] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!lastGesture) return
    if (emotionStore?.reactToGesture) {
      emotionStore.reactToGesture(lastGesture)
    }

    const reactions = {
      wave: ["👋 Warm wave back to you, friend!", "Hey there! Happy to see you! 🌸", "Wave received! ✨"],
      nod: ["I agree completely! 🤝", "Yes, yes! So true! 💖", "Nodding with you! 🌿"],
      point: ["I see what you're pointing at! 👀", "Interesting discovery! 🧭", "Got it! 📍"]
    }

    const gestureReactions = reactions[lastGesture.gesture] || []
    const reaction = gestureReactions[Math.floor(Math.random() * gestureReactions.length)]

    setMochiReaction(reaction)

    const timer = setTimeout(() => setMochiReaction(null), 4000)
    return () => clearTimeout(timer)
  }, [lastGesture, emotionStore])

  const emotion = emotionStore?.currentEmotion

  const EMOTION_THEMES = {
    happy: { 
      cardClass: 'gold-block', 
      icon: '🌸', 
      name: 'Happy & Peaceful', 
      desc: 'Feeling warm, cheerful, and connected.',
      accent: 'linear-gradient(90deg, #ffd700, #ffb7c5)',
      hearts: 5
    },
    concerned: { 
      cardClass: 'stone-block', 
      icon: '💜', 
      name: 'Thoughtful & Concerned', 
      desc: 'Listening closely and taking things in.',
      accent: 'linear-gradient(90deg, #c084fc, #7ee8fa)',
      hearts: 3
    },
    angry: { 
      cardClass: 'dirt-block', 
      icon: '🔥', 
      name: 'Passionate & Fiery', 
      desc: 'Experiencing intense focus and emotion.',
      accent: 'linear-gradient(90deg, #ff7675, #d85a7f)',
      hearts: 4
    },
    excited: { 
      cardClass: 'grass-block', 
      icon: '✨', 
      name: 'Excited & Inspired', 
      desc: 'Full of joy, wonder, and energy!',
      accent: 'linear-gradient(90deg, #ff85a2, #7ca954)',
      hearts: 5
    },
    neutral: { 
      cardClass: 'planks-block', 
      icon: '🍃', 
      name: 'Calm & Balanced', 
      desc: 'Relaxed and resting in harmony.',
      accent: 'linear-gradient(90deg, #9dca72, #7ca954)',
      hearts: 4
    }
  }

  const currentTheme = EMOTION_THEMES[emotion?.type] || EMOTION_THEMES.neutral

  return (
    <div className="minecraft-sky" style={{ paddingBottom: '70px' }}>
      
      {/* Main 3D Container */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '36px 20px 0 20px' }}>
        
        {/* Header 3D Grass Block Card */}
        <header className="mc-3d-block grass-block block-appear" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="xp-orb" />
            <span className="pixel-font" style={{ fontSize: '0.85rem', color: 'var(--mc-sakura-light)' }}>
              LEVEL 99 CHERRY GROVE COMPANION
            </span>
            <span className="xp-orb" />
          </div>
          <h1>🌾 MOCHI AI 🌾</h1>
          <p style={{ maxWidth: '580px', margin: '8px auto 0 auto', color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.1rem' }}>
            Your cute 3D Minecraft emotional companion. Expressing feelings & gestures in real-time.
          </p>
        </header>

        {/* 3D Mochi Viewport Shrine */}
        <section className="mc-3d-block stone-block block-appear" style={{ marginBottom: '32px', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🔮</span> 3D Mochi Character Shrine
            </h2>
            <div className="pixel-font" style={{
              background: 'rgba(192, 132, 252, 0.25)',
              border: '1px solid var(--mc-amethyst)',
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#ffffff'
            }}>
              3D CANVAS
            </div>
          </div>

          {/* Cute Floating 3D Speech Bubble for Gestures */}
          {mochiReaction && (
            <div className="float-effect" style={{ marginBottom: '12px' }}>
              <div className="speech-bubble-3d">
                {mochiReaction}
              </div>
            </div>
          )}

          <div style={{
            width: '100%',
            minHeight: '400px',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 50%, rgba(36, 26, 48, 0.6) 0%, rgba(12, 8, 18, 0.8) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)'
          }}>
            <MochiCharacter />
          </div>
        </section>

        {/* Emotion Status 3D Block Card */}
        <section className={`mc-3d-block ${currentTheme.cardClass} block-appear`} style={{ marginBottom: '32px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
            
            {/* 3D Emoji Avatar Block */}
            <div style={{
              fontSize: '3.8rem',
              width: '90px',
              height: '90px',
              borderRadius: '22px',
              background: 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(255, 255, 255, 0.35)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
            }}>
              {currentTheme.icon}
            </div>

            {/* Text & Hearts */}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pixel-font" style={{ fontSize: '0.78rem', color: 'var(--mc-sakura-light)', textTransform: 'uppercase' }}>
                  Emotional State
                </span>
                
                {/* Minecraft Health Hearts */}
                <div className="mc-heart-container">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="mc-heart">
                      {i < currentTheme.hearts ? '💖' : '🖤'}
                    </span>
                  ))}
                </div>
              </div>

              <h3 style={{ fontSize: '1.7rem', margin: '6px 0 2px 0', color: '#ffffff' }}>
                {currentTheme.name}
              </h3>
              <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                {currentTheme.desc}
              </p>
            </div>
          </div>

          {/* Emotional Intensity XP Bar */}
          {emotion?.intensity !== undefined && (
            <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.92rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Mood Intensity XP</span>
                <span className="pixel-font" style={{ fontWeight: 'bold', color: 'var(--mc-gold)' }}>{emotion.intensity}% XP</span>
              </div>
              <div className="intensity-track">
                <div 
                  className="intensity-fill" 
                  style={{ 
                    width: `${emotion.intensity}%`,
                    background: currentTheme.accent
                  }} 
                />
              </div>
            </div>
          )}
        </section>

        {/* 3D Hotbar Item Grid Navigation */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span style={{ fontSize: '1.6rem' }}>🎒</span>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Inventory Hotbar</h2>
          </div>

          <div className="blocks-grid">
            
            {/* Chat Card */}
            <div className="mc-3d-block block-item wood-block" onClick={() => navigate('/chat')}>
              <div className="item-icon">📖</div>
              <h3 style={{ fontSize: '1.3rem', margin: '4px 0 2px 0' }}>Chat Log</h3>
              <p style={{ fontSize: '0.88rem', margin: 0, opacity: 0.85, textAlign: 'center' }}>
                Talk with Mochi in real-time
              </p>
            </div>

            {/* Settings Card */}
            <div className="mc-3d-block block-item dirt-block" onClick={() => navigate('/settings')}>
              <div className="item-icon">⚙️</div>
              <h3 style={{ fontSize: '1.3rem', margin: '4px 0 2px 0' }}>Settings</h3>
              <p style={{ fontSize: '0.88rem', margin: 0, opacity: 0.85, textAlign: 'center' }}>
                Configure companion options
              </p>
            </div>

            {/* History Card */}
            <div className="mc-3d-block block-item planks-block" onClick={() => navigate('/emotion-history')}>
              <div className="item-icon">🗺️</div>
              <h3 style={{ fontSize: '1.3rem', margin: '4px 0 2px 0' }}>History Map</h3>
              <p style={{ fontSize: '0.88rem', margin: 0, opacity: 0.85, textAlign: 'center' }}>
                Explore emotional logs
              </p>
            </div>

          </div>
        </section>

        {/* Pose Skeleton Tracking Block */}
        <section className="mc-3d-block grass-block" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem' }}>📷 Pose Skeleton Tracker</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.98rem', marginBottom: '18px' }}>
            View and manage webcam motion detection & pose skeleton tracking in Settings.
          </p>
          <button 
            className="btn-primary btn-lg"
            onClick={() => navigate('/settings')}
          >
            ⚙️ Open Pose Tracker in Settings
          </button>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '20px 0', opacity: 0.8 }}>
          <p className="pixel-font" style={{ fontSize: '0.85rem', color: 'var(--mc-sakura-light)', margin: 0 }}>
            🌸 3D MINECRAFT CHERRY GROVE COMPANION 🌸
          </p>
        </footer>

      </div>
    </div>
  )
}
