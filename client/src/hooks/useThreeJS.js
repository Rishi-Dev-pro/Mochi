import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useEmotionStore } from '../store/emotionStore'

export function useThreeJS(containerRef) {
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const characterGroupRef = useRef(null)
  const headGroupRef = useRef(null)
  const mouthRef = useRef(null)
  const tongueRef = useRef(null)
  const leftEyebrowRef = useRef(null)
  const rightEyebrowRef = useRef(null)
  const leftArmRef = useRef(null)
  const rightArmRef = useRef(null)
  const bodyGroupRef = useRef(null)
  const tearsGroupRef = useRef(null)
  const angryEmberGroupRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0.35, 4.5)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Soft Studio & Shader Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5f8, 1.0)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.3)
    mainLight.position.set(4, 6, 5)
    mainLight.castShadow = true
    scene.add(mainLight)

    const rimLight = new THREE.PointLight(0xffb7c5, 1.2, 10)
    rimLight.position.set(-3, 4, -2)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0x7ee8fa, 0.7, 10)
    fillLight.position.set(3, 2, 2)
    scene.add(fillLight)

    // ==========================================
    // BUILD HUMAN-LIKE CUTE CHUBBY GIRL ("MOCHI")
    // ==========================================
    const characterGroup = new THREE.Group()
    characterGroupRef.current = characterGroup
    scene.add(characterGroup)

    // Materials - Fair Rosy Porcelain Skin
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff0e6, // Fair porcelain skin
      roughness: 0.3,
      metalness: 0.05
    })

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a2e2b, // Silky chocolate brown
      roughness: 0.4,
      metalness: 0.1
    })

    const dressMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb7c5, // Sakura Pink
      roughness: 0.4
    })

    const dressTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2
    })

    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: 0xff85a2,
      roughness: 0.3
    })

    const blushMaterial = new THREE.MeshStandardMaterial({
      color: 0xff85a2,
      roughness: 0.6,
      transparent: true,
      opacity: 0.65
    })

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1224,
      roughness: 0.1
    })

    const eyeSparkleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff
    })

    const tongueMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b81,
      roughness: 0.3
    })

    const eyebrowMaterial = new THREE.MeshBasicMaterial({
      color: 0x3d2422
    })

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdf7d,
      roughness: 0.2,
      metalness: 0.5
    })

    // 1. CUTE HUMAN BODY & DRESS
    const bodyGroup = new THREE.Group()
    bodyGroupRef.current = bodyGroup
    characterGroup.add(bodyGroup)

    // Flared Cute Skirt
    const skirtGeo = new THREE.CylinderGeometry(0.32, 0.82, 0.72, 32)
    const skirt = new THREE.Mesh(skirtGeo, dressMaterial)
    skirt.position.y = -0.42
    skirt.castShadow = true
    bodyGroup.add(skirt)

    // White Lace Trim
    const laceGeo = new THREE.TorusGeometry(0.82, 0.035, 16, 32)
    const lace = new THREE.Mesh(laceGeo, dressTrimMaterial)
    lace.rotation.x = Math.PI / 2
    lace.position.y = -0.78
    bodyGroup.add(lace)

    // Upper Torso
    const torsoGeo = new THREE.SphereGeometry(0.52, 24, 24)
    torsoGeo.scale(0.88, 1, 0.82)
    const torso = new THREE.Mesh(torsoGeo, dressMaterial)
    torso.position.y = -0.12
    bodyGroup.add(torso)

    // White Collar
    const collarGeo = new THREE.TorusGeometry(0.28, 0.045, 12, 24)
    const collar = new THREE.Mesh(collarGeo, dressTrimMaterial)
    collar.rotation.x = Math.PI / 2 + 0.15
    collar.position.set(0, 0.14, 0.08)
    bodyGroup.add(collar)

    // Gold Button on Collar
    const btnMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), goldMaterial)
    btnMesh.position.set(0, 0.06, 0.38)
    bodyGroup.add(btnMesh)

    // 2. FAIR SKIN LEGS & BOOTS
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.42, 16)

    const leftLeg = new THREE.Mesh(legGeo, skinMaterial)
    leftLeg.position.set(-0.22, -0.88, 0)
    bodyGroup.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeo, skinMaterial)
    rightLeg.position.set(0.22, -0.88, 0)
    bodyGroup.add(rightLeg)

    // Cute Boots
    const bootGeo = new THREE.SphereGeometry(0.16, 20, 20)
    bootGeo.scale(0.9, 0.75, 1.25)

    const leftBoot = new THREE.Mesh(bootGeo, ribbonMaterial)
    leftBoot.position.set(-0.22, -1.12, 0.04)
    leftBoot.castShadow = true
    bodyGroup.add(leftBoot)

    const rightBoot = new THREE.Mesh(bootGeo, ribbonMaterial)
    rightBoot.position.set(0.22, -1.12, 0.04)
    rightBoot.castShadow = true
    bodyGroup.add(rightBoot)

    // 3. ARMS & PUFFED SLEEVES
    const sleeveGeo = new THREE.SphereGeometry(0.2, 20, 20)
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 16)
    const handGeo = new THREE.SphereGeometry(0.1, 16, 16)

    // Left Arm
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.58, 0.08, 0)
    bodyGroup.add(leftArmGroup)
    leftArmRef.current = leftArmGroup

    const leftSleeve = new THREE.Mesh(sleeveGeo, dressMaterial)
    leftArmGroup.add(leftSleeve)

    const leftArm = new THREE.Mesh(armGeo, skinMaterial)
    leftArm.position.set(-0.06, -0.22, 0)
    leftArm.rotation.z = 0.25
    leftArmGroup.add(leftArm)

    const leftHand = new THREE.Mesh(handGeo, skinMaterial)
    leftHand.position.set(-0.12, -0.42, 0)
    leftArmGroup.add(leftHand)

    // Right Arm (Waving / Posing)
    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.58, 0.08, 0)
    bodyGroup.add(rightArmGroup)
    rightArmRef.current = rightArmGroup

    const rightSleeve = new THREE.Mesh(sleeveGeo, dressMaterial)
    rightArmGroup.add(rightSleeve)

    const rightArm = new THREE.Mesh(armGeo, skinMaterial)
    rightArm.position.set(0.06, -0.22, 0)
    rightArm.rotation.z = -0.25
    rightArmGroup.add(rightArm)

    const rightHand = new THREE.Mesh(handGeo, skinMaterial)
    rightHand.position.set(0.12, -0.42, 0)
    rightArmGroup.add(rightHand)

    // 4. REFINED HUMAN-LIKE HEAD (Tapered Jaw + Cute Chin)
    const headGroup = new THREE.Group()
    headGroup.position.y = 0.58
    characterGroup.add(headGroup)
    headGroupRef.current = headGroup

    // Upper Cranium
    const craniumGeo = new THREE.SphereGeometry(0.78, 36, 36)
    craniumGeo.scale(1.02, 0.92, 0.95)
    const cranium = new THREE.Mesh(craniumGeo, skinMaterial)
    cranium.castShadow = true
    headGroup.add(cranium)

    // Tapered Jawline & Cute Chin
    const chinGeo = new THREE.ConeGeometry(0.68, 0.45, 36)
    chinGeo.scale(1, 0.8, 0.7)
    const chin = new THREE.Mesh(chinGeo, skinMaterial)
    chin.position.set(0, -0.42, 0.1)
    chin.rotation.x = Math.PI
    headGroup.add(chin)

    // Cute Button Nose
    const noseGeo = new THREE.SphereGeometry(0.045, 12, 12)
    const nose = new THREE.Mesh(noseGeo, skinMaterial)
    nose.position.set(0, -0.1, 0.78)
    headGroup.add(nose)

    // Soft Rosy Cheeks
    const blushGeo = new THREE.SphereGeometry(0.16, 16, 16)
    blushGeo.scale(1.3, 0.45, 0.3)

    const leftBlush = new THREE.Mesh(blushGeo, blushMaterial)
    leftBlush.position.set(-0.38, -0.16, 0.72)
    leftBlush.rotation.y = -0.25
    headGroup.add(leftBlush)

    const rightBlush = new THREE.Mesh(blushGeo, blushMaterial)
    rightBlush.position.set(0.38, -0.16, 0.72)
    rightBlush.rotation.y = 0.25
    headGroup.add(rightBlush)

    // Human Ears
    const earGeo = new THREE.SphereGeometry(0.12, 16, 16)
    earGeo.scale(0.5, 0.9, 0.7)

    const leftEar = new THREE.Mesh(earGeo, skinMaterial)
    leftEar.position.set(-0.78, -0.06, 0)
    headGroup.add(leftEar)

    const rightEar = new THREE.Mesh(earGeo, skinMaterial)
    rightEar.position.set(0.78, -0.06, 0)
    headGroup.add(rightEar)

    // Dynamic 3D Eyebrows
    const eyebrowGeo = new THREE.BoxGeometry(0.18, 0.035, 0.04)

    const leftEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMaterial)
    leftEyebrow.position.set(-0.26, 0.24, 0.76)
    headGroup.add(leftEyebrow)
    leftEyebrowRef.current = leftEyebrow

    const rightEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMaterial)
    rightEyebrow.position.set(0.26, 0.24, 0.76)
    headGroup.add(rightEyebrow)
    rightEyebrowRef.current = rightEyebrow

    // Expressive Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 20, 20)
    eyeGeo.scale(0.85, 1.25, 0.4)

    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial)
    leftEye.position.set(-0.26, 0.06, 0.76)
    headGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial)
    rightEye.position.set(0.26, 0.06, 0.76)
    headGroup.add(rightEye)

    // Eye Sparkles
    const mainSparkleGeo = new THREE.SphereGeometry(0.04, 12, 12)
    const leftSparkle = new THREE.Mesh(mainSparkleGeo, eyeSparkleMaterial)
    leftSparkle.position.set(-0.23, 0.1, 0.81)
    headGroup.add(leftSparkle)

    const rightSparkle = new THREE.Mesh(mainSparkleGeo, eyeSparkleMaterial)
    rightSparkle.position.set(0.29, 0.1, 0.81)
    headGroup.add(rightSparkle)

    // Dynamic 3D Mouth
    const mouthGeo = new THREE.TorusGeometry(0.065, 0.02, 12, 20, Math.PI)
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xd85a7f })
    const mouth = new THREE.Mesh(mouthGeo, mouthMat)
    mouth.position.set(0, -0.25, 0.78)
    mouth.rotation.x = Math.PI
    headGroup.add(mouth)
    mouthRef.current = mouth

    // 3D Tongue Mesh (sticks out when trolling / excited!)
    const tongueGeo = new THREE.SphereGeometry(0.08, 16, 16)
    tongueGeo.scale(1, 0.6, 1.2)
    const tongue = new THREE.Mesh(tongueGeo, tongueMaterial)
    tongue.position.set(0, -0.28, 0.82)
    tongue.visible = false
    headGroup.add(tongue)
    tongueRef.current = tongue

    // 5. SILKY LONG HAIR & BANGS
    const hairGroup = new THREE.Group()
    headGroup.add(hairGroup)

    // Front Bangs
    const bangGeo = new THREE.SphereGeometry(0.2, 16, 16)
    bangGeo.scale(1.2, 0.9, 0.6)

    const bang1 = new THREE.Mesh(bangGeo, hairMaterial)
    bang1.position.set(-0.22, 0.5, 0.7)
    bang1.rotation.z = -0.2
    hairGroup.add(bang1)

    const bang2 = new THREE.Mesh(bangGeo, hairMaterial)
    bang2.position.set(0.22, 0.5, 0.7)
    bang2.rotation.z = 0.2
    hairGroup.add(bang2)

    const centerBang = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), hairMaterial)
    centerBang.position.set(0, 0.52, 0.76)
    hairGroup.add(centerBang)

    // Hair Cap
    const capGeo = new THREE.SphereGeometry(0.85, 32, 32)
    const hairCap = new THREE.Mesh(capGeo, hairMaterial)
    hairCap.position.set(0, 0.08, -0.05)
    hairGroup.add(hairCap)

    // Long Cascading Hair Strands
    const hairStrandGeo = new THREE.CylinderGeometry(0.22, 0.06, 1.9, 20)
    hairStrandGeo.scale(1, 1, 0.65)

    const leftStrand = new THREE.Mesh(hairStrandGeo, hairMaterial)
    leftStrand.position.set(-0.68, -0.45, -0.08)
    leftStrand.rotation.z = 0.22
    hairGroup.add(leftStrand)

    const rightStrand = new THREE.Mesh(hairStrandGeo, hairMaterial)
    rightStrand.position.set(0.68, -0.45, -0.08)
    rightStrand.rotation.z = -0.22
    hairGroup.add(rightStrand)

    // Back Hair Flow
    const backHairGeo = new THREE.SphereGeometry(0.68, 24, 24)
    backHairGeo.scale(1.15, 1.85, 0.55)
    const backHair = new THREE.Mesh(backHairGeo, hairMaterial)
    backHair.position.set(0, -0.45, -0.42)
    hairGroup.add(backHair)

    // Cute Flower Clip 🌸
    const flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), goldMaterial)
    flowerCenter.position.set(-0.5, 0.52, 0.62)
    hairGroup.add(flowerCenter)

    const petalGeo = new THREE.SphereGeometry(0.05, 12, 12)
    petalGeo.scale(1, 0.5, 1)

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const petal = new THREE.Mesh(petalGeo, dressTrimMaterial)
      petal.position.set(-0.5 + Math.cos(angle) * 0.09, 0.52 + Math.sin(angle) * 0.09, 0.61)
      hairGroup.add(petal)
    }

    // 6. GROUND SHADOW DISC
    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    })
    const shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -1.35
    characterGroup.add(shadow)

    // 7. EMOTION TEAR DROP PARTICLES (for Sad)
    const tearsGroup = new THREE.Group()
    tearsGroupRef.current = tearsGroup
    characterGroup.add(tearsGroup)

    const tearGeo = new THREE.SphereGeometry(0.04, 12, 12)
    tearGeo.scale(0.8, 1.4, 0.8)
    const tearMat = new THREE.MeshBasicMaterial({ color: 0x7ee8fa, transparent: true, opacity: 0.85 })

    const leftTear = new THREE.Mesh(tearGeo, tearMat)
    leftTear.position.set(-0.26, 0.35, 0.78)
    tearsGroup.add(leftTear)

    const rightTear = new THREE.Mesh(tearGeo, tearMat)
    rightTear.position.set(0.26, 0.35, 0.78)
    tearsGroup.add(rightTear)
    tearsGroup.visible = false

    // 8. ANGRY EMBER PARTICLES (for Angry)
    const angryEmberGroup = new THREE.Group()
    angryEmberGroupRef.current = angryEmberGroup
    characterGroup.add(angryEmberGroup)

    const emberGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06)
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff6b1a })

    for (let i = 0; i < 4; i++) {
      const ember = new THREE.Mesh(emberGeo, emberMat)
      const angle = (i / 4) * Math.PI * 2
      ember.position.set(Math.cos(angle) * 0.9, 0.2 + i * 0.2, Math.sin(angle) * 0.9)
      angryEmberGroup.add(ember)
    }
    angryEmberGroup.visible = false

    // ==========================================
    // DYNAMIC EMOTION & ANIMATION LOOP
    // ==========================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }

    const handleMouseMove = (event) => {
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      mouse.targetX = x * 0.38
      mouse.targetY = y * 0.28
    }

    window.addEventListener('mousemove', handleMouseMove)

    let animationId
    let clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      // Read current emotion from Zustand store dynamically
      const activeEmotion = useEmotionStore.getState().currentEmotion?.type || 'neutral'

      // Smooth Mouse Cursor Head Tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      if (headGroupRef.current) {
        headGroupRef.current.rotation.y = mouse.x
        headGroupRef.current.rotation.x = -mouse.y
      }

      // RESET EMOTION VISUALS FIRST
      if (tongueRef.current) tongueRef.current.visible = false
      if (tearsGroupRef.current) tearsGroupRef.current.visible = false
      if (angryEmberGroupRef.current) angryEmberGroupRef.current.visible = false

      // DYNAMIC POSES & FACIAL EXPRESSIONS PER EMOTION
      if (activeEmotion === 'angry') {
        // Angry / Shouting: Eyebrows slant inward (\ /), mouth shouting open, embers floating
        if (leftEyebrowRef.current) leftEyebrowRef.current.rotation.z = -0.35
        if (rightEyebrowRef.current) rightEyebrowRef.current.rotation.z = 0.35
        if (mouthRef.current) {
          mouthRef.current.rotation.x = 0
          mouthRef.current.position.set(0, -0.26, 0.78)
        }
        if (angryEmberGroupRef.current) {
          angryEmberGroupRef.current.visible = true
          angryEmberGroupRef.current.rotation.y = elapsedTime * 3
        }
        // Huffing stomping body animation
        if (characterGroupRef.current) {
          characterGroupRef.current.position.y = Math.sin(elapsedTime * 6) * 0.04
        }
      } else if (activeEmotion === 'sad' || activeEmotion === 'concerned') {
        // Sad / Pouting: Eyebrows tilt outward (/ \), mouth downward curve, head tilted down
        if (leftEyebrowRef.current) leftEyebrowRef.current.rotation.z = 0.3
        if (rightEyebrowRef.current) rightEyebrowRef.current.rotation.z = -0.3
        if (mouthRef.current) {
          mouthRef.current.rotation.x = Math.PI
          mouthRef.current.position.set(0, -0.28, 0.78)
        }
        if (tearsGroupRef.current && activeEmotion === 'sad') {
          tearsGroupRef.current.visible = true
        }
        // Drooping gentle pose
        if (characterGroupRef.current) {
          characterGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.03 - 0.05
        }
      } else if (activeEmotion === 'excited' || activeEmotion === 'happy') {
        // Happy / Excited / Trolling: Cute smile, tongue sticking out (for excited/trolling), arm waving!
        if (leftEyebrowRef.current) leftEyebrowRef.current.rotation.z = 0.1
        if (rightEyebrowRef.current) rightEyebrowRef.current.rotation.z = -0.1
        if (mouthRef.current) {
          mouthRef.current.rotation.x = Math.PI
          mouthRef.current.position.set(0, -0.22, 0.8)
        }
        // Stick out 3D tongue for excited/trolling
        if (tongueRef.current && activeEmotion === 'excited') {
          tongueRef.current.visible = true
          tongueRef.current.position.z = 0.82 + Math.sin(elapsedTime * 8) * 0.03
        }
        // Cheerful bouncing animation
        if (characterGroupRef.current) {
          characterGroupRef.current.position.y = Math.sin(elapsedTime * 3.5) * 0.09
        }
      } else {
        // Neutral / Normal: Friendly eyebrows & smile, gentle breathing
        if (leftEyebrowRef.current) leftEyebrowRef.current.rotation.z = 0
        if (rightEyebrowRef.current) rightEyebrowRef.current.rotation.z = 0
        if (mouthRef.current) {
          mouthRef.current.rotation.x = Math.PI
          mouthRef.current.position.set(0, -0.25, 0.78)
        }
        if (characterGroupRef.current) {
          characterGroupRef.current.position.y = Math.sin(elapsedTime * 2.2) * 0.06
        }
      }

      // Arm Waving & Pose Movements
      if (leftArmRef.current && rightArmRef.current) {
        if (activeEmotion === 'angry') {
          // Arms crossed / clenched
          leftArmRef.current.rotation.z = 0.5
          rightArmRef.current.rotation.z = -0.5
        } else {
          // Cute wave
          leftArmRef.current.rotation.z = Math.sin(elapsedTime * 2) * 0.08 - 0.1
          rightArmRef.current.rotation.z = -Math.sin(elapsedTime * 3) * 0.2 + 0.25
          rightArmRef.current.rotation.x = Math.sin(elapsedTime * 4) * 0.18 + 0.1
        }
      }

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
