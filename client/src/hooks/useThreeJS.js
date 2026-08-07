import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { useEmotionStore } from '../store/emotionStore'

export function useThreeJS(containerRef) {
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const vrmRef = useRef(null)
  const controlsRef = useRef(null)

  // Particle & FX Groups
  const tearsGroupRef = useRef(null)
  const angryEmberGroupRef = useRef(null)
  const shoutWaveGroupRef = useRef(null)
  const zzzGroupRef = useRef(null)
  const surpriseGroupRef = useRef(null)
  const confusedMarkRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // 1. SCENE & CAMERA SETUP
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    
    // Position camera to frame head & upper body directly at origin
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000)
    camera.position.set(0, 0.25, 2.0)

    // 2. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Orbit Controls for user interaction
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 0.15, 0)
    controls.maxPolarAngle = Math.PI / 1.8
    controls.minDistance = 1.0
    controls.maxDistance = 4.0
    controlsRef.current = controls

    // 3. SOFT STUDIO LIGHTING
    const ambientLight = new THREE.AmbientLight(0xfff6f8, 1.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    keyLight.position.set(2.5, 4, 3.5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    const rimLight = new THREE.PointLight(0xffc5d3, 1.6, 10)
    rimLight.position.set(-2.5, 2.5, -2)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0x9ee8fa, 1.2, 10)
    fillLight.position.set(2.5, 1, 2)
    scene.add(fillLight)

    // 4. LOAD CUTE VRM ANIME GIRL AVATAR
    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    const modelUrl = '/models/vrm_sample.vrm'

    loader.load(
      modelUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm
        if (!vrm) return

        // Position avatar so face is centered at Y = 0.15
        vrm.scene.position.set(0, -1.25, 0)
        vrm.scene.scale.set(1.35, 1.35, 1.35)
        vrm.scene.rotation.y = Math.PI // Face forward directly at camera

        // Enable shadows
        vrm.scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true
            obj.receiveShadow = true
          }
        })

        scene.add(vrm.scene)
        vrmRef.current = vrm
      },
      undefined,
      (err) => {
        console.error('Error loading VRM model:', err)
      }
    )

    // ========================================================
    // 5. EMOTION PARTICLE SYSTEM FX (Tears, Embers, Shout, ZZZ)
    // ========================================================

    // A. Tears (Sad)
    const tearsGroup = new THREE.Group()
    tearsGroupRef.current = tearsGroup
    scene.add(tearsGroup)

    const tearGeo = new THREE.SphereGeometry(0.02, 12, 12)
    tearGeo.scale(0.8, 1.5, 0.8)
    const tearMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.85 })

    const leftTear = new THREE.Mesh(tearGeo, tearMat)
    leftTear.position.set(-0.07, 0.24, 0.45)
    tearsGroup.add(leftTear)

    const rightTear = new THREE.Mesh(tearGeo, tearMat)
    rightTear.position.set(0.07, 0.24, 0.45)
    tearsGroup.add(rightTear)
    tearsGroup.visible = false

    // B. Angry Embers (Angry)
    const angryEmberGroup = new THREE.Group()
    angryEmberGroupRef.current = angryEmberGroup
    scene.add(angryEmberGroup)

    const emberGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03)
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3300 })

    for (let i = 0; i < 6; i++) {
      const ember = new THREE.Mesh(emberGeo, emberMat)
      const angle = (i / 6) * Math.PI * 2
      ember.position.set(Math.cos(angle) * 0.4, 0.25 + (i % 3) * 0.08, Math.sin(angle) * 0.4)
      angryEmberGroup.add(ember)
    }
    angryEmberGroup.visible = false

    // C. Shout Soundwave Rings (Shouting)
    const shoutWaveGroup = new THREE.Group()
    shoutWaveGroupRef.current = shoutWaveGroup
    scene.add(shoutWaveGroup)

    const waveMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, wireframe: true, transparent: true, opacity: 0.7 })

    for (let i = 0; i < 3; i++) {
      const wave = new THREE.Mesh(new THREE.TorusGeometry(0.07 + i * 0.04, 0.007, 12, 24), waveMat)
      wave.position.set(0, 0.16, 0.45 + i * 0.1)
      shoutWaveGroup.add(wave)
    }
    shoutWaveGroup.visible = false

    // D. Sleepy ZZZ (Sleepy)
    const zzzGroup = new THREE.Group()
    zzzGroupRef.current = zzzGroup
    scene.add(zzzGroup)

    const zMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa })
    for (let i = 0; i < 3; i++) {
      const zMesh = new THREE.Mesh(new THREE.BoxGeometry(0.045 - i * 0.01, 0.012, 0.012), zMat)
      zMesh.position.set(0.18 + i * 0.05, 0.35 + i * 0.08, 0.3)
      zzzGroup.add(zMesh)
    }
    zzzGroup.visible = false

    // E. Surprise Sparkles (Surprised)
    const surpriseGroup = new THREE.Group()
    surpriseGroupRef.current = surpriseGroup
    scene.add(surpriseGroup)

    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    for (let i = 0; i < 5; i++) {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.022), starMat)
      const angle = (i / 5) * Math.PI * 2
      star.position.set(Math.cos(angle) * 0.3, 0.5 + (i % 2) * 0.05, Math.sin(angle) * 0.2)
      surpriseGroup.add(star)
    }
    surpriseGroup.visible = false

    // F. Confused Question Mark (Confused)
    const confusedMark = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.01, 12, 20, Math.PI * 1.5),
      new THREE.MeshBasicMaterial({ color: 0xeab308 })
    )
    confusedMark.position.set(0.2, 0.48, 0.2)
    confusedMarkRef.current = confusedMark
    confusedMark.visible = false
    scene.add(confusedMark)

    // Helper: Reset VRM Expression Values
    const resetVRMExpressions = (vrm) => {
      if (!vrm || !vrm.expressionManager) return
      const presetNames = ['happy', 'angry', 'sad', 'surprised', 'aa', 'ee', 'ih', 'oh', 'ou', 'relaxed', 'neutral', 'blink', 'blinkLeft', 'blinkRight']
      presetNames.forEach((name) => vrm.expressionManager.setValue(name, 0))
    }

    // ========================================================
    // 6. DYNAMIC ANIMATION & EMOTION LOOP
    // ========================================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }

    const handleMouseMove = (event) => {
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      mouse.targetX = x * 0.25
      mouse.targetY = y * 0.18
    }

    window.addEventListener('mousemove', handleMouseMove)

    let animationId
    const clock = new THREE.Clock()
    let lastBlink = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const elapsedTime = clock.getElapsedTime()

      if (controlsRef.current) controlsRef.current.update()

      const vrm = vrmRef.current
      const activeEmotion = useEmotionStore.getState().currentEmotion?.type || 'neutral'

      // Smooth Head Tracking & Arm Poses
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      if (vrm && vrm.humanoid) {
        const headNode = vrm.humanoid.getNormalizedBoneNode('head')
        if (headNode) {
          headNode.rotation.y = mouse.x
          headNode.rotation.x = -mouse.y
        }

        // Apply natural resting arm pose (lowered arms down at sides instead of T-pose)
        const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
        const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm')
        const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm')
        const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm')

        if (activeEmotion === 'waving') {
          if (leftUpperArm) leftUpperArm.rotation.z = 1.25
          if (leftLowerArm) leftLowerArm.rotation.z = 0.1
          if (rightUpperArm) {
            rightUpperArm.rotation.z = -0.4 + Math.sin(elapsedTime * 6) * 0.35
            rightUpperArm.rotation.x = 0.5
          }
          if (rightLowerArm) rightLowerArm.rotation.y = -0.5
        } else {
          if (leftUpperArm) leftUpperArm.rotation.z = 1.25
          if (rightUpperArm) rightUpperArm.rotation.z = -1.25
          if (leftLowerArm) leftLowerArm.rotation.z = 0.15
          if (rightLowerArm) rightLowerArm.rotation.z = -0.15
        }
      }

      // Hide all FX by default
      if (tearsGroupRef.current) tearsGroupRef.current.visible = false
      if (angryEmberGroupRef.current) angryEmberGroupRef.current.visible = false
      if (shoutWaveGroupRef.current) shoutWaveGroupRef.current.visible = false
      if (zzzGroupRef.current) zzzGroupRef.current.visible = false
      if (surpriseGroupRef.current) surpriseGroupRef.current.visible = false
      if (confusedMarkRef.current) confusedMarkRef.current.visible = false

      if (vrm && vrm.expressionManager) {
        resetVRMExpressions(vrm)

        // Natural Eye Blink Cycle
        const isBlinking = (elapsedTime - lastBlink > 3.5) && (elapsedTime - lastBlink < 3.7)
        if (elapsedTime - lastBlink > 3.7) lastBlink = elapsedTime

        switch (activeEmotion) {
          case 'happy':
          case 'excited':
            vrm.expressionManager.setValue('happy', 1.0)
            if (vrm.scene) vrm.scene.position.y = -1.25 + Math.sin(elapsedTime * 4) * 0.03
            break

          case 'waving':
            vrm.expressionManager.setValue('happy', 1.0)
            if (vrm.scene) {
              vrm.scene.position.y = -1.25 + Math.sin(elapsedTime * 3) * 0.02
              vrm.scene.rotation.y = Math.PI + Math.sin(elapsedTime * 4) * 0.04
            }
            break

          case 'teasing':
            vrm.expressionManager.setValue('happy', 0.6)
            vrm.expressionManager.setValue('blinkLeft', 1.0) // Playful Wink!
            vrm.expressionManager.setValue('oh', 0.3)
            if (vrm.scene) {
              vrm.scene.rotation.y = Math.PI + Math.sin(elapsedTime * 3) * 0.05
              vrm.scene.position.y = -1.25 + Math.sin(elapsedTime * 4) * 0.02
            }
            break

          case 'shouting':
            vrm.expressionManager.setValue('aa', 1.0)
            vrm.expressionManager.setValue('angry', 0.5)
            if (shoutWaveGroupRef.current) {
              shoutWaveGroupRef.current.visible = true
              shoutWaveGroupRef.current.children.forEach((w, idx) => {
                const s = 1 + ((elapsedTime * 3 + idx * 0.5) % 1.5)
                w.scale.set(s, s, s)
              })
            }
            if (vrm.scene) vrm.scene.position.y = -1.25 + Math.sin(elapsedTime * 15) * 0.02
            break

          case 'angry':
            vrm.expressionManager.setValue('angry', 1.0)
            if (angryEmberGroupRef.current) {
              angryEmberGroupRef.current.visible = true
              angryEmberGroupRef.current.rotation.y = elapsedTime * 4
            }
            if (vrm.scene) vrm.scene.position.y = -1.25 + Math.sin(elapsedTime * 8) * 0.02
            break

          case 'sad':
            vrm.expressionManager.setValue('sad', 1.0)
            if (tearsGroupRef.current) {
              tearsGroupRef.current.visible = true
              tearsGroupRef.current.children.forEach((t, i) => {
                t.position.y = 0.24 - ((elapsedTime * 1.5 + i * 0.4) % 0.3)
              })
            }
            if (vrm.scene) vrm.scene.position.y = -1.28 + Math.sin(elapsedTime * 1.5) * 0.015
            break

          case 'surprised':
            vrm.expressionManager.setValue('surprised', 1.0)
            if (surpriseGroupRef.current) {
              surpriseGroupRef.current.visible = true
              surpriseGroupRef.current.rotation.y = elapsedTime * 2
            }
            if (vrm.scene) vrm.scene.position.y = -1.22 + Math.sin(elapsedTime * 6) * 0.02
            break

          case 'confused':
            vrm.expressionManager.setValue('surprised', 0.4)
            vrm.expressionManager.setValue('ih', 0.4)
            if (confusedMarkRef.current) {
              confusedMarkRef.current.visible = true
              confusedMarkRef.current.rotation.z = Math.sin(elapsedTime * 4) * 0.2
            }
            if (vrm.scene) vrm.scene.rotation.y = Math.PI + 0.15
            break

          case 'sleepy':
            vrm.expressionManager.setValue('relaxed', 0.9)
            vrm.expressionManager.setValue('blink', 0.8)
            if (zzzGroupRef.current) {
              zzzGroupRef.current.visible = true
              zzzGroupRef.current.children.forEach((z, i) => {
                z.position.y = 0.35 + i * 0.08 + Math.sin(elapsedTime * 2 + i) * 0.02
              })
            }
            if (vrm.scene) vrm.scene.position.y = -1.27 + Math.sin(elapsedTime * 1.2) * 0.02
            break

          default: // Neutral
            if (isBlinking) {
              vrm.expressionManager.setValue('blink', 1.0)
            }
            vrm.expressionManager.setValue('neutral', 1.0)
            if (vrm.scene) {
              vrm.scene.position.y = -1.25 + Math.sin(elapsedTime * 2) * 0.02
              vrm.scene.rotation.y = Math.PI
            }
            break
        }

        vrm.expressionManager.update()
        vrm.update(delta)
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle Window Resize
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

  return { sceneRef, rendererRef, vrmRef, controlsRef }
}




