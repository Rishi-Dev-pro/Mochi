import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useEmotionStore } from '../store/useEmotionStore'

export function useThreeJS(containerRef) {
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const characterGroupRef = useRef(null)
  const headGroupRef = useRef(null)
  const leftArmRef = useRef(null)
  const rightArmRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0.4, 4.5)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Soft Aesthetic Lighting
    const ambientLight = new THREE.AmbientLight(0xfff0f5, 0.9)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(4, 6, 5)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 1024
    mainLight.shadow.mapSize.height = 1024
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0xffb7c5, 0.6)
    fillLight.position.set(-4, 3, -2)
    scene.add(fillLight)

    const rimLight = new THREE.PointLight(0x7ee8fa, 0.8, 10)
    rimLight.position.set(0, 4, -3)
    scene.add(rimLight)

    // ==========================================
    // BUILD CUTE CHUBBY CHILD CHARACTER ("MOCHI")
    // ==========================================
    const characterGroup = new THREE.Group()
    characterGroupRef.current = characterGroup
    scene.add(characterGroup)

    // Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe5d9,
      roughness: 0.4,
      metalness: 0.05
    })

    const hoodieMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb7c5, // Cute Sakura Pink
      roughness: 0.5,
      metalness: 0.1
    })

    const overallsMaterial = new THREE.MeshStandardMaterial({
      color: 0x7ee8fa, // Pastel Blue
      roughness: 0.5
    })

    const blushMaterial = new THREE.MeshStandardMaterial({
      color: 0xff85a2,
      roughness: 0.6,
      transparent: true,
      opacity: 0.75
    })

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1424,
      roughness: 0.1
    })

    const eyeHighlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff
    })

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdf7d,
      roughness: 0.2,
      metalness: 0.6
    })

    // 1. CHUBBY BODY (Torso + Overalls)
    const bodyGroup = new THREE.Group()
    characterGroup.add(bodyGroup)

    // Chubby belly
    const torsoGeo = new THREE.SphereGeometry(0.75, 32, 32)
    torsoGeo.scale(1, 0.9, 0.95)
    const torso = new THREE.Mesh(torsoGeo, hoodieMaterial)
    torso.position.y = -0.3
    torso.castShadow = true
    bodyGroup.add(torso)

    // Overall Straps
    const strapGeo = new THREE.BoxGeometry(0.12, 0.65, 0.08)
    const leftStrap = new THREE.Mesh(strapGeo, overallsMaterial)
    leftStrap.position.set(-0.28, -0.05, 0.62)
    leftStrap.rotation.z = -0.15
    bodyGroup.add(leftStrap)

    const rightStrap = new THREE.Mesh(strapGeo, overallsMaterial)
    rightStrap.position.set(0.28, -0.05, 0.62)
    rightStrap.rotation.z = 0.15
    bodyGroup.add(rightStrap)

    // Cute Buttons on Straps
    const buttonGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16)
    buttonGeo.rotateX(Math.PI / 2)
    const leftBtn = new THREE.Mesh(buttonGeo, goldMaterial)
    leftBtn.position.set(-0.25, -0.28, 0.67)
    bodyGroup.add(leftBtn)

    const rightBtn = new THREE.Mesh(buttonGeo, goldMaterial)
    rightBtn.position.set(0.25, -0.28, 0.67)
    bodyGroup.add(rightBtn)

    // 2. CHUBBY LEGS & BOOTS
    const legGeo = new THREE.SphereGeometry(0.26, 24, 24)
    legGeo.scale(0.9, 1.2, 0.9)

    const bootMaterial = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.6 })

    const leftLeg = new THREE.Mesh(legGeo, bootMaterial)
    leftLeg.position.set(-0.32, -0.9, 0.05)
    leftLeg.castShadow = true
    bodyGroup.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeo, bootMaterial)
    rightLeg.position.set(0.32, -0.9, 0.05)
    rightLeg.castShadow = true
    bodyGroup.add(rightLeg)

    // 3. CHUBBY ARMS
    const armGeo = new THREE.SphereGeometry(0.22, 24, 24)
    armGeo.scale(0.8, 1.4, 0.8)

    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.75, -0.15, 0)
    bodyGroup.add(leftArmGroup)
    const leftArm = new THREE.Mesh(armGeo, hoodieMaterial)
    leftArm.position.y = -0.2
    leftArmGroup.add(leftArm)
    leftArmRef.current = leftArmGroup

    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.75, -0.15, 0)
    bodyGroup.add(rightArmGroup)
    const rightArm = new THREE.Mesh(armGeo, hoodieMaterial)
    rightArm.position.y = -0.2
    rightArmGroup.add(rightArm)
    rightArmRef.current = rightArmGroup

    // Chubby Little Hands
    const handGeo = new THREE.SphereGeometry(0.14, 16, 16)
    const leftHand = new THREE.Mesh(handGeo, skinMaterial)
    leftHand.position.set(0, -0.42, 0)
    leftArmGroup.add(leftHand)

    const rightHand = new THREE.Mesh(handGeo, skinMaterial)
    rightHand.position.set(0, -0.42, 0)
    rightArmGroup.add(rightHand)

    // 4. CUTE CHUBBY HEAD
    const headGroup = new THREE.Group()
    headGroup.position.y = 0.55
    characterGroup.add(headGroup)
    headGroupRef.current = headGroup

    // Chubby round head
    const headGeo = new THREE.SphereGeometry(0.88, 36, 36)
    headGeo.scale(1.05, 0.96, 1)
    const head = new THREE.Mesh(headGeo, skinMaterial)
    head.castShadow = true
    headGroup.add(head)

    // Cute Chubby Cheeks (Rosy Blush)
    const blushGeo = new THREE.SphereGeometry(0.2, 20, 20)
    blushGeo.scale(1.2, 0.6, 0.4)

    const leftBlush = new THREE.Mesh(blushGeo, blushMaterial)
    leftBlush.position.set(-0.48, -0.18, 0.72)
    leftBlush.rotation.y = -0.3
    headGroup.add(leftBlush)

    const rightBlush = new THREE.Mesh(blushGeo, blushMaterial)
    rightBlush.position.set(0.48, -0.18, 0.72)
    rightBlush.rotation.y = 0.3
    headGroup.add(rightBlush)

    // Cute Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 20, 20)
    eyeGeo.scale(0.85, 1.15, 0.5)

    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial)
    leftEye.position.set(-0.3, 0.06, 0.8)
    headGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial)
    rightEye.position.set(0.3, 0.06, 0.8)
    headGroup.add(rightEye)

    // Eye Highlights (Catchlights)
    const highlightGeo = new THREE.SphereGeometry(0.04, 12, 12)
    const leftHL = new THREE.Mesh(highlightGeo, eyeHighlightMaterial)
    leftHL.position.set(-0.27, 0.1, 0.86)
    headGroup.add(leftHL)

    const rightHL = new THREE.Mesh(highlightGeo, eyeHighlightMaterial)
    rightHL.position.set(0.33, 0.1, 0.86)
    headGroup.add(rightHL)

    // Cute Mouth (Smiling Arc)
    const mouthGeo = new THREE.TorusGeometry(0.08, 0.025, 12, 24, Math.PI)
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xd85a7f })
    const mouth = new THREE.Mesh(mouthGeo, mouthMat)
    mouth.position.set(0, -0.22, 0.83)
    mouth.rotation.x = Math.PI
    headGroup.add(mouth)

    // Cute Bear / Animal Hoodie Ears on Top
    const earGeo = new THREE.SphereGeometry(0.24, 24, 24)
    const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xff85a2, roughness: 0.4 })

    const leftEar = new THREE.Mesh(earGeo, hoodieMaterial)
    leftEar.position.set(-0.62, 0.78, 0)
    headGroup.add(leftEar)

    const leftInnerEar = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), innerEarMat)
    leftInnerEar.position.set(-0.62, 0.78, 0.1)
    headGroup.add(leftInnerEar)

    const rightEar = new THREE.Mesh(earGeo, hoodieMaterial)
    rightEar.position.set(0.62, 0.78, 0)
    headGroup.add(rightEar)

    const rightInnerEar = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), innerEarMat)
    rightInnerEar.position.set(0.62, 0.78, 0.1)
    headGroup.add(rightInnerEar)

    // Sprouts 🌱 on top of head
    const sproutStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8)
    const sproutStem = new THREE.Mesh(sproutStemGeo, new THREE.MeshStandardMaterial({ color: 0x88b04b }))
    sproutStem.position.set(0, 0.95, 0)
    headGroup.add(sproutStem)

    const leafGeo = new THREE.SphereGeometry(0.1, 12, 12)
    leafGeo.scale(1.4, 0.3, 0.7)
    const leaf = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0x88b04b }))
    leaf.position.set(0.08, 1.04, 0)
    leaf.rotation.z = -0.4
    headGroup.add(leaf)

    // 5. GROUND SHADOW DISC
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    })
    const shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -1.25
    characterGroup.add(shadow)

    // FLOATING PARTICLES (Sakura Hearts)
    const heartGroup = new THREE.Group()
    characterGroup.add(heartGroup)

    const heartGeo = new THREE.SphereGeometry(0.08, 12, 12)
    const heartMat = new THREE.MeshStandardMaterial({ color: 0xff85a2, emissive: 0xff85a2, emissiveIntensity: 0.4 })

    for (let i = 0; i < 4; i++) {
      const pHeart = new THREE.Mesh(heartGeo, heartMat)
      const angle = (i / 4) * Math.PI * 2
      pHeart.position.set(Math.cos(angle) * 1.3, 0.2 + (i % 2) * 0.4, Math.sin(angle) * 1.3)
      heartGroup.add(pHeart)
    }

    // ==========================================
    // MOUSE TRACKING & ANIMATION LOOP
    // ==========================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }

    const handleMouseMove = (event) => {
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      mouse.targetX = x * 0.4
      mouse.targetY = y * 0.3
    }

    window.addEventListener('mousemove', handleMouseMove)

    let animationId
    let clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      // Smooth mouse head tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      if (headGroupRef.current) {
        headGroupRef.current.rotation.y = mouse.x
        headGroupRef.current.rotation.x = -mouse.y
      }

      // Idle floating breathing animation
      if (characterGroupRef.current) {
        characterGroupRef.current.position.y = Math.sin(elapsedTime * 2.2) * 0.08
      }

      // Arm waving & breathing movement
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.z = Math.sin(elapsedTime * 2.5) * 0.12 - 0.2
        rightArmRef.current.rotation.z = -Math.sin(elapsedTime * 2.5) * 0.12 + 0.2
        rightArmRef.current.rotation.x = Math.sin(elapsedTime * 3.5) * 0.2 + 0.2 // Cute wave
      }

      // Rotate floating hearts
      heartGroup.rotation.y = elapsedTime * 0.6

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
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (container && domElement) {
        container.removeChild(domElement)
      }
    }
  }, [containerRef])

  return { sceneRef, rendererRef, characterGroupRef }
}
