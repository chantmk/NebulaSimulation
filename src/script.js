import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import galaxyVertexShader from './Shaders/galaxyVertex.glsl'
import galaxyFragmenntShader from './Shaders/galaxyFragment.glsl'
import cheapCloud from './Shaders/cloudFragment.glsl'
import textureFragment from './Shaders/textureFragment.glsl'
import textureVertex from './Shaders/textureVertex.glsl'

/**
 * Canvas
 */
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
const cloudTexture = textureLoader.load('/clouds.png', () => {
    console.log("Cloud loaded")
})

/**
 * Parameters
 */

const parameters = {
    enableStar: true,
    enableCloud: false,
    enableTexture: true,
    time: {
        value: 0.0
    }
}

const starParameters = {
    count: 8000,
    size: 60.0,
    radius: 5,
    branches: 3,
    randomRange: 0.6,
    randomnessPower: 2.7,
    scaleRange: 2,
    insideColor: '#ff6030',
    outsideColor: '#1b3984'
}

const textureParameters = {
    count: 550,
    size: 720.0,
    radius: 6.67,
    branches: 3,
    randomRange: 0.6,
    randomnessPower: 1.3,
    scaleRange: 2.4,
    insideColor: '#ff6030',
    outsideColor: '#1b3984'
}
/**
 * General
 */

const clearGalaxy = (object) => {
    if (object !== null) {
        object.geometry.dispose()
        object.material.dispose()
        scene.remove(object)
    }
}

const generateGalaxy = () => {
    clearGalaxy(stars)
    if (parameters.enableStar) {
        generateStars()
    }

    // if (parameters.enableCloud) {
    //     generateCloud()
    // }

    clearGalaxy(textureCloud)
    if (parameters.enableTexture) {
        generateTexture()
    }
}

/**
 * Particles - Stars
 */

let starGeometry = null
let starMaterial = null
let stars = null

const generateStars = () => {
    clearGalaxy(stars)

    starGeometry = new THREE.BufferGeometry()

    const positions = new Float32Array(starParameters.count * 3)
    const colors = new Float32Array(starParameters.count * 3)
    const scales = new Float32Array(starParameters.count)
    const randomness = new Float32Array(starParameters.count * 3)

    const colorInside = new THREE.Color(starParameters.insideColor)
    const colorOutside = new THREE.Color(starParameters.outsideColor)

    for (let i = 0; i < starParameters.count; i++) {
        const i3 = i * 3

        // Position
        const radius = Math.random() * starParameters.radius
        const branchAngle = ((i%starParameters.branches)/starParameters.branches) * 2 * Math.PI
        
        positions[i3] = Math.cos(branchAngle) * radius
        positions[i3+1] = 0
        positions[i3+2] = Math.sin(branchAngle) * radius

        randomness[i3] = (Math.pow(Math.random(), starParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * starParameters.randomRange
        randomness[i3+1] = (Math.pow(Math.random(), starParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * starParameters.randomRange
        randomness[i3+2] = (Math.pow(Math.random(), starParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * starParameters.randomRange
        
        // Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / starParameters.radius)

        colors[i3] = mixedColor.r
        colors[i3+1] = mixedColor.g
        colors[i3+2] = mixedColor.b

        scales[i] = Math.random() * starParameters.scaleRange
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    starGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    starGeometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))

    /**
     * Material
     */

    starMaterial = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmenntShader,
        uniforms: {
            uSize: {value: starParameters.size * renderer.getPixelRatio()},
            uTime: {value: 0},
            uTexture: {type: "t", value: cloudTexture},
            uResolution: {value: new THREE.Vector3(sizes.width, sizes.height, 1)}
        }
    })

    /**
     * Point
     */
    stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
}

/**
 * Particle - cloud texture
 */
let textureGeometry = null
let textureMaterial = null
let textureCloud = null

const generateTexture = () => {

    clearGalaxy(textureCloud)

    textureGeometry = new THREE.BufferGeometry()

    const texturePositions = new Float32Array(textureParameters.count * 3)
    const textureColors = new Float32Array(textureParameters.count * 3)
    const textureScales = new Float32Array(textureParameters.count)
    const textureRandomness = new Float32Array(textureParameters.count * 3)
    const textureRotation = new Float32Array(textureParameters.count)

    const colorInside = new THREE.Color(textureParameters.insideColor)
    const colorOutside = new THREE.Color(textureParameters.outsideColor)

    for (let i = 0; i < textureParameters.count; i++) {
        const i3 = i * 3

        // Position
        const radius = Math.random() * textureParameters.radius
        const branchAngle = ((i%textureParameters.branches)/textureParameters.branches) * 2 * Math.PI

        texturePositions[i3] = Math.cos(branchAngle) * radius
        texturePositions[i3+1] = 0
        texturePositions[i3+2] = Math.sin(branchAngle) * radius

        textureRandomness[i3] = (Math.pow(Math.random(), textureParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * starParameters.randomRange
        textureRandomness[i3+1] = (Math.pow(Math.random(), textureParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * starParameters.randomRange
        textureRandomness[i3+2] = (Math.pow(Math.random(), textureParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * starParameters.randomRange

        // Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / textureParameters.radius)

        textureColors[i3] = mixedColor.r
        textureColors[i3+1] = mixedColor.g
        textureColors[i3+2] = mixedColor.b

        // Scale
        textureScales[i] = Math.random() * textureParameters.scaleRange

        // Rotation
        textureRotation[i] = Math.random()
    }

    textureGeometry.setAttribute('position', new THREE.BufferAttribute(texturePositions, 3))
    textureGeometry.setAttribute('color', new THREE.BufferAttribute(textureColors, 3))
    textureGeometry.setAttribute('aScale', new THREE.BufferAttribute(textureScales, 1))
    textureGeometry.setAttribute('aRandomness', new THREE.BufferAttribute(textureRandomness, 3))
    textureGeometry.setAttribute('aRotation', new THREE.BufferAttribute(textureRotation, 1))
    console.log(textureGeometry.attributes)
    /**
     * Material
     */

    textureMaterial = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        vertexShader: textureVertex,
        fragmentShader: textureFragment,
        uniforms: {
            uSize: {value: textureParameters.size * renderer.getPixelRatio()},
            uTime: {value: 0},
            uTexture: {type: "t", value: cloudTexture},
            uResolution: {value: new THREE.Vector3(sizes.width, sizes.height, 1)}
        }
    })
    console.log(cloudTexture)
    /**
     * Point
     */
    textureCloud = new THREE.Points(textureGeometry, textureMaterial)
    scene.add(textureCloud)
}

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
 * Debug
 */
const gui = new dat.GUI()

const generalFolder = gui.addFolder("General")
generalFolder.add(parameters, 'enableStar').onChange(generateGalaxy)
generalFolder.add(parameters, 'enableCloud').onChange(generateGalaxy)
generalFolder.add(parameters, 'enableTexture').onChange(generateGalaxy)

const starFolder = gui.addFolder("Star")
starFolder.add(starParameters, 'count').min(1).max(100000).step(1).onFinishChange(generateStars)
starFolder.add(starParameters, 'size').min(0.01).max(1000).step(0.01).onFinishChange(generateStars)
starFolder.add(starParameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateStars)
starFolder.add(starParameters, 'branches').min(2).max(10).step(1).onFinishChange(generateStars)
starFolder.add(starParameters, 'randomRange').min(0).max(5).step(0.01).onFinishChange(generateStars)
starFolder.add(starParameters, 'randomnessPower').min(1).max(10).step(0.1).onFinishChange(generateStars)
starFolder.add(starParameters, 'scaleRange').min(0).max(10).step(0.1).onFinishChange(generateStars)
starFolder.addColor(starParameters, 'insideColor').onFinishChange(generateStars)
starFolder.addColor(starParameters, 'outsideColor').onFinishChange(generateStars)

const textureFolder = gui.addFolder("textureFolder")
textureFolder.add(textureParameters, 'count').min(1).max(1000).step(1).onFinishChange(generateTexture)
textureFolder.add(textureParameters, 'size').min(100).max(1000).step(1).onFinishChange(generateTexture)
textureFolder.add(textureParameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateTexture)
textureFolder.add(textureParameters, 'branches').min(2).max(10).step(1).onFinishChange(generateTexture)
textureFolder.add(textureParameters, 'randomRange').min(0).max(2).step(0.001).onFinishChange(generateTexture)
textureFolder.add(textureParameters, 'randomnessPower').min(1).max(10).step(0.1).onFinishChange(generateTexture)
textureFolder.add(textureParameters, 'scaleRange').min(0).max(10).step(0.1).onFinishChange(generateTexture)
textureFolder.addColor(textureParameters, 'insideColor').onFinishChange(generateTexture)
textureFolder.addColor(textureParameters, 'outsideColor').onFinishChange(generateTexture)

/**
 * Animate
 */

generateGalaxy()

const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update material
    if (parameters.enableStar) {
        starMaterial.uniforms.uTime.value = elapsedTime
    }
    if (parameters.enableTexture) {
        textureMaterial.uniforms.uTime.value = elapsedTime
    }
    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()