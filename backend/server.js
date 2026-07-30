import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Placeholder routes (to be implemented in Phase 3+)
app.post('/api/check-in', (req, res) => {
  res.json({ message: 'Check-in endpoint ready for Phase 3' })
})

app.post('/api/emotion-update', (req, res) => {
  res.json({ message: 'Emotion update endpoint ready for Phase 3' })
})

app.post('/api/stream-clause', (req, res) => {
  res.json({ message: 'Stream Claude endpoint ready for Phase 3' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mochi Backend running on http://localhost:${PORT}`)
})
