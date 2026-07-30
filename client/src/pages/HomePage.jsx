import MochiCharacter from '../components/MochiCharacter'

export default function HomePage() {
  return (
    <div className="page">
      <h1>Welcome to Mochi</h1>
      <p>Your persistent 3D AI companion.</p>
      <MochiCharacter />
    </div>
  )
}
