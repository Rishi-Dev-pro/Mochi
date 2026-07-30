import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function useThreeJS(containerRef) {
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cubeRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)
    sceneRef.current = scene

    // Camera setup
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 3

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Cube (placeholder for Mochi)
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshPhongMaterial({ color: 0x6366f1 })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
    cubeRef.current = cube

    // Animation loop
    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      cube.rotation.x += 0.005
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    const container = containerRef.current
    const domElement = renderer.domElement
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (container && domElement) {
        container.removeChild(domElement)
      }
    }
  }, [containerRef])

  return { sceneRef, rendererRef, cubeRef }
}
