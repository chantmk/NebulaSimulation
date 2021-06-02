import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import galaxyVertexShader from './Shaders/galaxyVertex.glsl'
import galaxyFragmenntShader from './Shaders/galaxyFragment.glsl'

/**
 * Canvase
 */
const gui = new dat.GUI()
const canvas = document.querySelector('canvas.webgl')

/**
 * Scene
 */

const scene = new THREE.Scene()


/**
 * Sizes
 */
 const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Renderer
 */

 const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 *  Texture
 */

const loadingManager = new THREE.LoadingManager()
const textureLoader = new THREE.TextureLoader(loadingManager)
const cloudTexture = textureLoader.load('/clouds.png')
/**
 * Particles
 */

const parameters = {
    // count: 10000,
    count: 1000,
    size: 60.0,
    radius: 5,
    branches: 3,
    spin: 1,
    randomness: 0.6,
    randomnessPower: 2.7,
    insideColor: '#ff6030',
    outsideColor: '#1b3984'
}

let geometry = null
let material = null
let points = null

const generateGalaxy = () => {
    if (points !== null) {
        geometry.dispose() // .dispose will free the memiry from object provided by Three.js
        material.dispose()
        scene.remove(points)
    }

    geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    const scales = new Float32Array(parameters.count)
    const randomness = new Float32Array(parameters.count * 3)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3
        const radius = Math.random() * parameters.radius
        const branchAngle = ((i%parameters.branches)/parameters.branches) * 2 * Math.PI
        const spinAngle = radius * parameters.spin
        
        positions[i3] = Math.cos(branchAngle + spinAngle) * radius
        positions[i3+1] = 0
        positions[i3+2] = Math.sin(branchAngle + spinAngle) * radius

        randomness[i3] = (Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * parameters.randomness
        randomness[i3+1] = (Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * parameters.randomness
        randomness[i3+2] = (Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * parameters.randomness

        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / parameters.radius)

        colors[i3] = mixedColor.r
        colors[i3+1] = mixedColor.g
        colors[i3+2] = mixedColor.b

        scales[i] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))

    /**
     * Material
     */
    // material = new THREE.PointsMaterial({
    //     size: parameters.size,
    //     sizeAttenuation: true,
    //     depthWrite: false,
    //     blending: THREE.AdditiveBlending,
    //     map: cloudTexture
    // })
    material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmenntShader,
        uniforms: {
            uSize: {value: parameters.size * renderer.getPixelRatio()},
            uTime: {value: 0},
            uTexture: {type: "t", value: cloudTexture}
        }
    })

    /**
     * Point
     */
    points = new THREE.Points(geometry, material)
    // points = new THREE.Mesh(geometry, material)
    scene.add(points)
}

generateGalaxy()

/**
 * Debug
 */
gui.add(parameters, 'count').min(1).max(100000).step(1).onFinishChange(generateGalaxy)
// gui.add(parameters, 'count').min(1).max(1).step(0).onFinishChange(generateGalaxy)
gui.add(parameters, 'size').min(0.01).max(500).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'branches').min(2).max(10).step(1).onFinishChange(generateGalaxy)
// gui.add(parameters, 'spin').min(-5).max(5).step(0.1).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.1).onFinishChange(generateGalaxy)
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

/**
 * Camera
 */

 const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
 camera.position.x = 3
 camera.position.y = 3
 camera.position.z = 3
 scene.add(camera)
 
 /**
  * Constrols
  */
 
 const controls = new OrbitControls(camera, canvas)
 controls.enableDamping = true
 
/**
 * Animate
 */

const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update material
    material.uniforms.uTime.value = elapsedTime
    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()