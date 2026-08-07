import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function useThreeJS(containerRef) {
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const characterGroupRef = useRef(null)
  const headGroupRef = useRef(null)
  const hairGroupRef = useRef(null)
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
    camera.position.set(0, 0.3, 4.6)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Soft Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5f8, 0.95)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.25)
    mainLight.position.set(4, 6, 5)
    mainLight.castShadow = true
    scene.add(mainLight)

    const rimLight = new THREE.PointLight(0xffb7c5, 1.0, 10)
    rimLight.position.set(-3, 4, -2)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0x7ee8fa, 0.6, 10)
    fillLight.position.set(3, 2, 2)
    scene.add(fillLight)

    // ==========================================
    // BUILD CUTE 3D CHUBBY GIRL WITH LONG HAIR
    // ==========================================
    const characterGroup = new THREE.Group()
    characterGroupRef.current = characterGroup
    scene.add(characterGroup)

    // Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffedd8, // Warm porcelain skin
      roughness: 0.35,
      metalness: 0.05
    })

    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a2e2b, // Warm chocolate brown
      roughness: 0.5,
      metalness: 0.1
    })

    const dressMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb7c5, // Sakura Pink Dress
      roughness: 0.4
    })

    const dressTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3
    })

    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: 0xff85a2,
      roughness: 0.3,
      metalness: 0.2
    })

    const blushMaterial = new THREE.MeshStandardMaterial({
      color: 0xff85a2,
      roughness: 0.6,
      transparent: true,
      opacity: 0.65
    })

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1224,
      roughness: 0.1
    })

    const eyeSparkleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff
    })

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdf7d,
      roughness: 0.2,
      metalness: 0.5
    })

    // 1. CUTE DRESS & CHUBBY BODY
    const bodyGroup = new THREE.Group()
    characterGroup.add(bodyGroup)

    // Cute A-line Dress Skirt
    const skirtGeo = new THREE.CylinderGeometry(0.35, 0.85, 0.75, 32)
    const skirt = new THREE.Mesh(skirtGeo, dressMaterial)
    skirt.position.y = -0.45
    skirt.castShadow = true
    bodyGroup.add(skirt)

    // White Lace Trim at bottom of skirt
    const laceGeo = new THREE.TorusGeometry(0.85, 0.04, 16, 32)
    const lace = new THREE.Mesh(laceGeo, dressTrimMaterial)
    lace.rotation.x = Math.PI / 2
    lace.position.y = -0.8
    bodyGroup.add(lace)

    // Upper Torso
    const torsoGeo = new THREE.SphereGeometry(0.55, 24, 24)
    torsoGeo.scale(0.9, 1, 0.85)
    const torso = new THREE.Mesh(torsoGeo, dressMaterial)
    torso.position.y = -0.15
    bodyGroup.add(torso)

    // Cute Collar
    const collarGeo = new THREE.TorusGeometry(0.32, 0.05, 12, 24)
    const collar = new THREE.Mesh(collarGeo, dressTrimMaterial)
    collar.rotation.x = Math.PI / 2 + 0.2
    collar.position.set(0, 0.12, 0.1)
    bodyGroup.add(collar)

    // Cute Ribbon Bow on Dress
    const bowGeo = new THREE.SphereGeometry(0.12, 16, 16)
    bowGeo.scale(1.4, 0.7, 0.5)
    const bowLeft = new THREE.Mesh(bowGeo, ribbonMaterial)
    bowLeft.position.set(-0.1, 0.05, 0.42)
    bowLeft.rotation.z = -0.3
    bodyGroup.add(bowLeft)

    const bowRight = new THREE.Mesh(bowGeo, ribbonMaterial)
    bowRight.position.set(0.1, 0.05, 0.42)
    bowRight.rotation.z = 0.3
    bodyGroup.add(bowRight)

    const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), goldMaterial)
    bowKnot.position.set(0, 0.05, 0.45)
    bodyGroup.add(bowKnot)

    // 2. CHUBBY LEGS & BOOTS
    const legGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.4, 16)

    const leftLeg = new THREE.Mesh(legGeo, skinMaterial)
    leftLeg.position.set(-0.25, -0.9, 0)
    bodyGroup.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeo, skinMaterial)
    rightLeg.position.set(0.25, -0.9, 0)
    bodyGroup.add(rightLeg)

    // Cute Pink Boots
    const bootGeo = new THREE.SphereGeometry(0.18, 20, 20)
    bootGeo.scale(0.9, 0.8, 1.2)

    const leftBoot = new THREE.Mesh(bootGeo, ribbonMaterial)
    leftBoot.position.set(-0.25, -1.15, 0.05)
    leftBoot.castShadow = true
    bodyGroup.add(leftBoot)

    const rightBoot = new THREE.Mesh(bootGeo, ribbonMaterial)
    rightBoot.position.set(0.25, -1.15, 0.05)
    rightBoot.castShadow = true
    bodyGroup.add(rightBoot)

    // 3. CHUBBY ARMS & PUFFED SLEEVES
    const sleeveGeo = new THREE.SphereGeometry(0.22, 20, 20)
    
    // Left Arm Group
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.62, 0.05, 0)
    bodyGroup.add(leftArmGroup)
    leftArmRef.current = leftArmGroup

    const leftSleeve = new THREE.Mesh(sleeveGeo, dressMaterial)
    leftArmGroup.add(leftSleeve)

    const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.45, 16)
    const leftArm = new THREE.Mesh(armGeo, skinMaterial)
    leftArm.position.set(-0.08, -0.22, 0)
    leftArm.rotation.z = 0.3
    leftArmGroup.add(leftArm)

    const handGeo = new THREE.SphereGeometry(0.11, 16, 16)
    const leftHand = new THREE.Mesh(handGeo, skinMaterial)
    leftHand.position.set(-0.16, -0.42, 0)
    leftArmGroup.add(leftHand)

    // Right Arm Group (Waving)
    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.62, 0.05, 0)
    bodyGroup.add(rightArmGroup)
    rightArmRef.current = rightArmGroup

    const rightSleeve = new THREE.Mesh(sleeveGeo, dressMaterial)
    rightArmGroup.add(rightSleeve)

    const rightArm = new THREE.Mesh(armGeo, skinMaterial)
    rightArm.position.set(0.08, -0.22, 0)
    rightArm.rotation.z = -0.3
    rightArmGroup.add(rightArm)

    const rightHand = new THREE.Mesh(handGeo, skinMaterial)
    rightHand.position.set(0.16, -0.42, 0)
    rightArmGroup.add(rightHand)

    // 4. CUTE CHUBBY GIRL HEAD & LONG HAIR
    const headGroup = new THREE.Group()
    headGroup.position.y = 0.58
    characterGroup.add(headGroup)
    headGroupRef.current = headGroup

    // Chubby Round Face
    const headGeo = new THREE.SphereGeometry(0.82, 36, 36)
    headGeo.scale(1.05, 0.95, 0.98)
    const head = new THREE.Mesh(headGeo, skinMaterial)
    head.castShadow = true
    headGroup.add(head)

    // Cute Human Ears
    const earGeo = new THREE.SphereGeometry(0.14, 16, 16)
    earGeo.scale(0.6, 1, 0.8)

    const leftEar = new THREE.Mesh(earGeo, skinMaterial)
    leftEar.position.set(-0.84, -0.05, 0)
    headGroup.add(leftEar)

    const rightEar = new THREE.Mesh(earGeo, skinMaterial)
    rightEar.position.set(0.84, -0.05, 0)
    headGroup.add(rightEar)

    // Cute Cheeks (Rosy Blush)
    const blushGeo = new THREE.SphereGeometry(0.18, 16, 16)
    blushGeo.scale(1.3, 0.5, 0.3)

    const leftBlush = new THREE.Mesh(blushGeo, blushMaterial)
    leftBlush.position.set(-0.42, -0.16, 0.72)
    leftBlush.rotation.y = -0.3
    headGroup.add(leftBlush)

    const rightBlush = new THREE.Mesh(blushGeo, blushMaterial)
    rightBlush.position.set(0.42, -0.16, 0.72)
    rightBlush.rotation.y = 0.3
    headGroup.add(rightBlush)

    // Big Anime Eyes
    const eyeGeo = new THREE.SphereGeometry(0.13, 20, 20)
    eyeGeo.scale(0.85, 1.2, 0.4)

    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial)
    leftEye.position.set(-0.28, 0.06, 0.78)
    headGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial)
    rightEye.position.set(0.3, 0.06, 0.78)
    headGroup.add(rightEye)

    // Eye Sparkles / Catchlights
    const mainSparkleGeo = new THREE.SphereGeometry(0.045, 12, 12)
    const subSparkleGeo = new THREE.SphereGeometry(0.025, 12, 12)

    const leftSparkle1 = new THREE.Mesh(mainSparkleGeo, eyeSparkleMaterial)
    leftSparkle1.position.set(-0.25, 0.1, 0.83)
    headGroup.add(leftSparkle1)

    const leftSparkle2 = new THREE.Mesh(subSparkleGeo, eyeSparkleMaterial)
    leftSparkle2.position.set(-0.31, 0.02, 0.83)
    headGroup.add(leftSparkle2)

    const rightSparkle1 = new THREE.Mesh(mainSparkleGeo, eyeSparkleMaterial)
    rightSparkle1.position.set(0.33, 0.1, 0.83)
    headGroup.add(rightSparkle1)

    const rightSparkle2 = new THREE.Mesh(subSparkleGeo, eyeSparkleMaterial)
    rightSparkle2.position.set(0.27, 0.02, 0.83)
    headGroup.add(rightSparkle2)

    // Cute Eyelashes
    const lashGeo = new THREE.TorusGeometry(0.14, 0.02, 8, 16, Math.PI / 2)
    const leftLash = new THREE.Mesh(lashGeo, eyeMaterial)
    leftLash.position.set(-0.28, 0.2, 0.78)
    leftLash.rotation.z = -0.3
    headGroup.add(leftLash)

    const rightLash = new THREE.Mesh(lashGeo, eyeMaterial)
    rightLash.position.set(0.3, 0.2, 0.78)
    rightLash.rotation.z = Math.PI - 0.3
    headGroup.add(rightLash)

    // Cute Smile
    const mouthGeo = new THREE.TorusGeometry(0.07, 0.02, 12, 20, Math.PI)
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xd85a7f })
    const mouth = new THREE.Mesh(mouthGeo, mouthMat)
    mouth.position.set(0, -0.22, 0.81)
    mouth.rotation.x = Math.PI
    headGroup.add(mouth)

    // 5. LONG FLOWING HAIR & BANGS
    const hairGroup = new THREE.Group()
    headGroup.add(hairGroup)
    hairGroupRef.current = hairGroup

    // Front Hair Bangs
    const bangGeo = new THREE.SphereGeometry(0.22, 16, 16)
    bangGeo.scale(1.2, 0.9, 0.6)

    const bang1 = new THREE.Mesh(bangGeo, hairMaterial)
    bang1.position.set(-0.25, 0.52, 0.72)
    bang1.rotation.z = -0.2
    hairGroup.add(bang1)

    const bang2 = new THREE.Mesh(bangGeo, hairMaterial)
    bang2.position.set(0.25, 0.52, 0.72)
    bang2.rotation.z = 0.2
    hairGroup.add(bang2)

    const centerBang = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), hairMaterial)
    centerBang.position.set(0, 0.55, 0.78)
    hairGroup.add(centerBang)

    // Main Hair Cap
    const capGeo = new THREE.SphereGeometry(0.89, 32, 32)
    const hairCap = new THREE.Mesh(capGeo, hairMaterial)
    hairCap.position.set(0, 0.08, -0.05)
    hairGroup.add(hairCap)

    // LONG TWIN TAILS / LONG HAIR LOCKS
    const longHairGeo = new THREE.CylinderGeometry(0.25, 0.08, 1.8, 24)
    longHairGeo.scale(1, 1, 0.7)

    // Left Long Hair Strand
    const leftLongHair = new THREE.Mesh(longHairGeo, hairMaterial)
    leftLongHair.position.set(-0.72, -0.4, -0.1)
    leftLongHair.rotation.z = 0.25
    leftLongHair.rotation.x = 0.1
    hairGroup.add(leftLongHair)

    // Right Long Hair Strand
    const rightLongHair = new THREE.Mesh(longHairGeo, hairMaterial)
    rightLongHair.position.set(0.72, -0.4, -0.1)
    rightLongHair.rotation.z = -0.25
    rightLongHair.rotation.x = 0.1
    hairGroup.add(rightLongHair)

    // Back Hair Cascade
    const backHairGeo = new THREE.SphereGeometry(0.7, 24, 24)
    backHairGeo.scale(1.2, 1.8, 0.6)
    const backHair = new THREE.Mesh(backHairGeo, hairMaterial)
    backHair.position.set(0, -0.4, -0.45)
    hairGroup.add(backHair)

    // Cute Flower Hair Clip 🌸
    const flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), goldMaterial)
    flowerCenter.position.set(-0.55, 0.55, 0.65)
    hairGroup.add(flowerCenter)

    const petalGeo = new THREE.SphereGeometry(0.06, 12, 12)
    petalGeo.scale(1, 0.5, 1)

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const petal = new THREE.Mesh(petalGeo, dressTrimMaterial)
      petal.position.set(-0.55 + Math.cos(angle) * 0.1, 0.55 + Math.sin(angle) * 0.1, 0.64)
      hairGroup.add(petal)
    }

    // 6. GROUND SHADOW
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    })
    const shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -1.35
    characterGroup.add(shadow)

    // FLOATING SAKURA PETALS & SPARKLES
    const sparklesGroup = new THREE.Group()
    characterGroup.add(sparklesGroup)

    const sparkleGeo = new THREE.OctahedronGeometry(0.08, 0)
    const sparkleMat = new THREE.MeshStandardMaterial({
      color: 0xffdf7d,
      emissive: 0xffdf7d,
      emissiveIntensity: 0.6
    })

    for (let i = 0; i < 5; i++) {
      const sp = new THREE.Mesh(sparkleGeo, sparkleMat)
      const angle = (i / 5) * Math.PI * 2
      sp.position.set(Math.cos(angle) * 1.35, -0.2 + (i % 3) * 0.5, Math.sin(angle) * 1.35)
      sparklesGroup.add(sp)
    }

    // ==========================================
    // MOUSE TRACKING & ANIMATION LOOP
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

      // Smooth mouse head tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      if (headGroupRef.current) {
        headGroupRef.current.rotation.y = mouse.x
        headGroupRef.current.rotation.x = -mouse.y
      }

      // Gentle hair swaying
      if (leftLongHair && rightLongHair) {
        leftLongHair.rotation.z = 0.25 + Math.sin(elapsedTime * 2) * 0.06
        rightLongHair.rotation.z = -0.25 - Math.sin(elapsedTime * 2) * 0.06
      }

      // Idle floating breathing animation
      if (characterGroupRef.current) {
        characterGroupRef.current.position.y = Math.sin(elapsedTime * 2.2) * 0.07
      }

      // Arm waving & cute movement
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.z = Math.sin(elapsedTime * 2) * 0.08 - 0.1
        rightArmRef.current.rotation.z = -Math.sin(elapsedTime * 3) * 0.18 + 0.2
        rightArmRef.current.rotation.x = Math.sin(elapsedTime * 4) * 0.15 + 0.1
      }

      // Rotate sparkles
      sparklesGroup.rotation.y = elapsedTime * 0.5

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
