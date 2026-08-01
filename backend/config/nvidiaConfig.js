import dotenv from 'dotenv'

dotenv.config()

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct'

const MOCHI_SYSTEM_PROMPT = `You are Mochi, a friendly and empathetic 3D AI companion. 
Respond naturally and warmly. Keep responses concise (1-2 sentences).
Occasionally end responses with an emotion tag: <emotion type="happy|curious|concerned|sleepy|excited|neutral" intensity="0-100"/>
Example: "That sounds amazing! <emotion type="excited" intensity="85"/>"`

export {
  NVIDIA_API_KEY,
  NVIDIA_API_URL,
  NVIDIA_MODEL,
  MOCHI_SYSTEM_PROMPT
}
