import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useEmotionStore } from '../store/emotionStore'

export function useThreeJS(containerRef) {
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const avatarGroupRef = useRef(null)
  const headNodeRef = useRef(null)
  const rightArmBoneRef = useRef(null)
  const leftArmBoneRef = useRef(null)
  const morphMeshesRef = useRef([])

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
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
    camera.position.set(0, 0.15, 2.3) // Perfect bust framing

    // 2. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 3. STUDIO LIGHTING
    const ambientLight = new THREE.AmbientLight(0xfff6f8, 1.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6)
    keyLight.position.set(3, 4, 3.5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    const rimLight = new THREE.PointLight(0xffc5d3, 1.5, 10)
    rimLight.position.set(-2.5, 2.5, -2)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0x9ee8fa, 1.0, 10)
    fillLight.position.set(2.5, 1, 2)
    scene.add(fillLight)

    // Avatar Root Container
    const avatarGroup = new THREE.Group()
    avatarGroupRef.current = avatarGroup
    scene.add(avatarGroup)

    // 4. LOAD REAL 3D FEMALE AVATAR GLB MODEL
    const loader = new GLTFLoader()
    const modelUrl = '/models/avatar_female.glb'

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene
        model.scale.set(1.5, 1.5, 1.5)
        model.position.set(0, -1.82, 0)
        avatarGroup.add(model)

        // Traversal for Bones, Meshes & Morph Targets
        const morphMeshes = []
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            if (child.morphTargetDictionary && child.morphTargetInfluences) {
              morphMeshes.push(child)
            }
          }
          if (child.isBone) {
            if (child.name === 'Head') headNodeRef.current = child
            if (child.name === 'RightArm') rightArmBoneRef.current = child
            if (child.name === 'LeftArm') leftArmBoneRef.current = child
          }
        })
        morphMeshesRef.current = morphMeshes
      },
      undefined,
      (err) => {
        console.error('Error loading 3D female avatar GLB:', err)
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
    leftTear.position.set(-0.08, 0.28, 0.5)
    tearsGroup.add(leftTear)

    const rightTear = new THREE.Mesh(tearGeo, tearMat)
    rightTear.position.set(0.08, 0.28, 0.5)
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
      ember.position.set(Math.cos(angle) * 0.45, 0.3 + (i % 3) * 0.08, Math.sin(angle) * 0.45)
      angryEmberGroup.add(ember)
    }
    angryEmberGroup.visible = false

    // C. Shout Soundwave Rings (Shouting)
    const shoutWaveGroup = new THREE.Group()
    shoutWaveGroupRef.current = shoutWaveGroup
    scene.add(shoutWaveGroup)

    const waveMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, wireframe: true, transparent: true, opacity: 0.7 })

    for (let i = 0; i < 3; i++) {
      const wave = new THREE.Mesh(new THREE.TorusGeometry(0.08 + i * 0.05, 0.008, 12, 24), waveMat)
      wave.position.set(0, 0.15, 0.5 + i * 0.1)
      shoutWaveGroup.add(wave)
    }
    shoutWaveGroup.visible = false

    // D. Sleepy ZZZ (Sleepy)
    const zzzGroup = new THREE.Group()
    zzzGroupRef.current = zzzGroup
    scene.add(zzzGroup)

    const zMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa })
    for (let i = 0; i < 3; i++) {
      const zMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05 - i * 0.01, 0.012, 0.012), zMat)
      zMesh.position.set(0.2 + i * 0.06, 0.4 + i * 0.1, 0.3)
      zzzGroup.add(zMesh)
    }
    zzzGroup.visible = false

    // E. Surprise Sparkles (Surprised)
    const surpriseGroup = new THREE.Group()
    surpriseGroupRef.current = surpriseGroup
    scene.add(surpriseGroup)

    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    for (let i = 0; i < 5; i++) {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.025), starMat)
      const angle = (i / 5) * Math.PI * 2
      star.position.set(Math.cos(angle) * 0.3, 0.6 + (i % 2) * 0.05, Math.sin(angle) * 0.2)
      surpriseGroup.add(star)
    }
    surpriseGroup.visible = false

    // F. Confused Question Mark (Confused)
    const confusedMark = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.012, 12, 20, Math.PI * 1.5),
      new THREE.MeshBasicMaterial({ color: 0xeab308 })
    )
    confusedMark.position.set(0.22, 0.55, 0.2)
    confusedMarkRef.current = confusedMark
    confusedMark.visible = false
    scene.add(confusedMark)

    // Helper: Set Morph Target Influence across all sub-meshes
    const setMorph = (targetName, value) => {
      morphMeshesRef.current.forEach((mesh) => {
        const index = mesh.morphTargetDictionary[targetName]
        if (index !== undefined) {
          mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            mesh.morphTargetInfluences[index] || 0,
            value,
            0.2
          )
        }
      })
    }

    // Helper: Reset all morph targets to 0
    const resetMorphs = () => {
      const allTargets = [
        'mouthSmile', 'mouthSmileLeft', 'mouthSmileRight', 'tongueOut',
        'viseme_aa', 'viseme_O', 'jawOpen', 'mouthOpen', 'browDownLeft',
        'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
        'eyeBlinkLeft', 'eyeBlinkRight', 'eyeWideLeft', 'eyeWideRight',
        'eyeSquintLeft', 'eyeSquintRight', 'mouthFrownLeft', 'mouthFrownRight',
        'noseSneerLeft', 'noseSneerRight', 'jawLeft', 'mouthDimpleRight', 'mouthPucker'
      ]
      allTargets.forEach((name) => setMorph(name, 0))
    }

    // ========================================================
    // 6. DYNAMIC ANIMATION & EMOTION ENGINE
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
      const elapsedTime = clock.getElapsedTime()

      // Read active emotion
      const activeEmotion = useEmotionStore.getState().currentEmotion?.type || 'neutral'

      // Smooth Head Tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      if (headNodeRef.current) {
        headNodeRef.current.rotation.y = mouse.x
        headNodeRef.current.rotation.x = -mouse.y
      } else if (avatarGroupRef.current) {
        avatarGroupRef.current.rotation.y = mouse.x * 0.6
        avatarGroupRef.current.rotation.x = -mouse.y * 0.4
      }

      // Hide all FX by default
      if (tearsGroupRef.current) tearsGroupRef.current.visible = false
      if (angryEmberGroupRef.current) angryEmberGroupRef.current.visible = false
      if (shoutWaveGroupRef.current) shoutWaveGroupRef.current.visible = false
      if (zzzGroupRef.current) zzzGroupRef.current.visible = false
      if (surpriseGroupRef.current) surpriseGroupRef.current.visible = false
      if (confusedMarkRef.current) confusedMarkRef.current.visible = false

      resetMorphs()

      // Natural Eye Blink Cycle
      const isBlinking = (elapsedTime - lastBlink > 3.8) && (elapsedTime - lastBlink < 4.0)
      if (elapsedTime - lastBlink > 4.0) lastBlink = elapsedTime

      // --- EMOTION MORPH TARGET MAPPINGS ---
      switch (activeEmotion) {
        case 'happy':
        case 'excited':
          setMorph('mouthSmile', 0.85)
          setMorph('cheekSquintLeft', 0.5)
          setMorph('cheekSquintRight', 0.5)
          setMorph('browOuterUpLeft', 0.35)
          setMorph('browOuterUpRight', 0.35)
          if (avatarGroupRef.current) {
            avatarGroupRef.current.position.y = Math.sin(elapsedTime * 4) * 0.04
          }
          break

        case 'waving':
          setMorph('mouthSmile', 0.9)
          setMorph('browOuterUpLeft', 0.3)
          setMorph('browOuterUpRight', 0.3)
          if (avatarGroupRef.current) {
            avatarGroupRef.current.position.y = Math.sin(elapsedTime * 3) * 0.03
            avatarGroupRef.current.rotation.z = Math.sin(elapsedTime * 4) * 0.05
          }
          if (rightArmBoneRef.current) {
            rightArmBoneRef.current.rotation.z = -1.2 + Math.sin(elapsedTime * 6) * 0.3
          }
          break

        case 'teasing':
          setMorph('tongueOut', 0.95)
          setMorph('eyeBlinkLeft', 0.95) // Playful Wink!
          setMorph('mouthSmileRight', 0.7)
          setMorph('browOuterUpRight', 0.5)
          if (avatarGroupRef.current) {
            avatarGroupRef.current.rotation.z = Math.sin(elapsedTime * 3) * 0.06
            avatarGroupRef.current.position.y = Math.sin(elapsedTime * 4) * 0.03
          }
          break

        case 'shouting':
          setMorph('viseme_aa', 1.0)
          setMorph('jawOpen', 0.85)
          setMorph('eyeWideLeft', 0.75)
          setMorph('eyeWideRight', 0.75)
          setMorph('browDownLeft', 0.6)
          setMorph('browDownRight', 0.6)
          if (shoutWaveGroupRef.current) {
            shoutWaveGroupRef.current.visible = true
            shoutWaveGroupRef.current.children.forEach((w, idx) => {
              const s = 1 + ((elapsedTime * 3 + idx * 0.5) % 1.5)
              w.scale.set(s, s, s)
            })
          }
          if (avatarGroupRef.current) {
            avatarGroupRef.current.position.y = Math.sin(elapsedTime * 15) * 0.02
          }
          break

        case 'angry':
          setMorph('browDownLeft', 1.0)
          setMorph('browDownRight', 1.0)
          setMorph('mouthFrownLeft', 0.85)
          setMorph('mouthFrownRight', 0.85)
          setMorph('noseSneerLeft', 0.7)
          setMorph('noseSneerRight', 0.7)
          if (angryEmberGroupRef.current) {
            angryEmberGroupRef.current.visible = true
            angryEmberGroupRef.current.rotation.y = elapsedTime * 4
          }
          if (avatarGroupRef.current) {
            avatarGroupRef.current.position.y = Math.sin(elapsedTime * 8) * 0.02
          }
          break

        case 'sad':
          setMorph('browInnerUp', 1.0)
          setMorph('mouthFrownLeft', 0.9)
          setMorph('mouthFrownRight', 0.9)
          setMorph('eyeSquintLeft', 0.4)
          setMorph('eyeSquintRight', 0.4)
          if (tearsGroupRef.current) {
            tearsGroupRef.current.visible = true
            tearsGroupRef.current.children.forEach((t, i) => {
              t.position.y = 0.28 - ((elapsedTime * 1.5 + i * 0.4) % 0.3)
            })
          }
          if (avatarGroupRef.current) {
            avatarGroupRef.current.position.y = -0.04 + Math.sin(elapsedTime * 1.5) * 0.015
          }
          break

        case 'surprised':
          setMorph('eyeWideLeft', 1.0)
          setMorph('eyeWideRight', 1.0)
          setMorph('viseme_O', 0.85)
          setMorph('browInnerUp', 0.8)
          if (surpriseGroupRef.current) {
            surpriseGroupRef.current.visible = true
            surpriseGroupRef.current.rotation.y = elapsedTime * 2
          }
          if (avatarGroupRef.current) {
            avatarGroupRef.current.position.y = 0.04 + Math.sin(elapsedTime * 6) * 0.02
          }
          break

        case 'confused':
          setMorph('browOuterUpLeft', 1.0)
          setMorph('browDownRight', 0.7)
          setMorph('jawLeft', 0.3)
          setMorph('mouthDimpleRight', 0.6)
          if (confusedMarkRef.current) {
            confusedMarkRef.current.visible = true
            confusedMarkRef.current.rotation.z = Math.sin(elapsedTime * 4) * 0.2
          }
          if (avatarGroupRef.current) {
            avatarGroupRef.current.rotation.z = 0.15
          }
          break

        case 'sleepy':
          setMorph('eyeBlinkLeft', 0.85)
          setMorph('eyeBlinkRight', 0.85)
          setMorph('mouthPucker', 0.3)
          if (zzzGroupRef.current) {
            zzzGroupRef.current.visible = true
            zzzGroupRef.current.children.forEach((z, i) => {
              z.position.y = 0.4 + i * 0.1 + Math.sin(elapsedTime * 2 + i) * 0.02
            })
          }
          if (avatarGroupRef.current) {
            avatarGroupRef.current.position.y = Math.sin(elapsedTime * 1.2) * 0.02 - 0.02
          }
          break

        default: // Neutral
          if (isBlinking) {
            setMorph('eyeBlinkLeft', 1.0)
            setMorph('eyeBlinkRight', 1.0)
          }
          setMorph('mouthSmile', 0.15)
          if (avatarGroupRef.current) {
            avatarGroupRef.current.position.y = Math.sin(elapsedTime * 2) * 0.02
            avatarGroupRef.current.rotation.z = 0
          }
          break
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

  return { sceneRef, rendererRef, avatarGroupRef }
}


