import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {ImprovedNoise} from 'three/examples/jsm/math/ImprovedNoise.js'
import * as dat from 'dat.gui'
import galaxyVertexShader from './Shaders/galaxyVertex.glsl'
import galaxyFragmentShader from './Shaders/galaxyFragment.glsl'
import volumetricCloudVertex from './Shaders/cloudVertex.glsl'
import volumetricCloudFragment from './Shaders/cloudFragment.glsl'
import textureFragment from './Shaders/textureFragment.glsl'
import textureVertex from './Shaders/textureVertex.glsl'
import cloudNoiseVertex from './Shaders/pointCloudVertex.glsl'
import cloudNoiseFragment from './Shaders/pointCloudFragment.glsl'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { Color } from 'three'

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

const cubeLoader = new THREE.CubeTextureLoader()
const cubeTexture = cubeLoader.load([
    '/GalaxyTex_PositiveX.jpg',
    '/GalaxyTex_NegativeX.jpg',
    '/GalaxyTex_PositiveY.jpg',
    '/GalaxyTex_NegativeY.jpg',
    '/GalaxyTex_PositiveZ.jpg',
    '/GalaxyTex_NegativeZ.jpg'
])

scene.background = cubeTexture
/**
 * Parameters
 */

const parameters = {
    enableCloud: true,
    enableCloudNoise: false,
    enableCloudTexture: false,
    enableStar: false,
}

const starParameters = {
    count: 100,
    size: 60.0,
    radius: 5,
    branches: 3,
    randomRange: 0.6,
    randomnessPower: 2.7,
    scaleRange: 2,
    insideColor: '#ff6030',
    outsideColor: '#1b3984'
}

const cloudShaderParameters = {
    count: 200,
    size: 580,
    radius: 5,
    branches: 3,
    randomRange: 0.6,
    randomnessPower: 3.5,
    scaleRange: 2.1,
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

const cloudParameters = {
    perlinSize: 128,
    perlinScale: 0.05,
    threshold: 0.3,
    opacity: 0.5,
    range: 0.15,
    steps: 100,
    size: 0.05,
    base: '#27277f'
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

    clearGalaxy(cloudShader)
    if (parameters.enableCloudNoise) {
        generateCloudShader()
    }
    clearGalaxy(textureCloud)
    if (parameters.enableCloudTexture) {
        generateTexture()
    }

    clearGalaxy(cloud)
    if (parameters.enableCloud) {
        generateCloud()
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

    /**
     * Star's attribute
     */
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
        
        // Scale
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
        fragmentShader: galaxyFragmentShader,
        uniforms: {
            uSize: {value: starParameters.size * renderer.getPixelRatio()},
            uTime: {value: 0},
            uTexture: {type: "t", value: cloudTexture},
            uResolution: {value: new THREE.Vector3(sizes.width, sizes.height, 1)},
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
 * Particles - Clooud: Shader the perlin noise
 */

 let cloudShaderGeometry = null
 let cloudShaderMaterial = null
 let cloudShader = null
 
 const generateCloudShader = () => {
     clearGalaxy(cloudShader)
 
     cloudShaderGeometry = new THREE.BufferGeometry()
 
     /**
      * Star's attribute
      */
     const positions = new Float32Array(cloudShaderParameters.count * 3)
     const colors = new Float32Array(cloudShaderParameters.count * 3)
     const scales = new Float32Array(cloudShaderParameters.count)
     const randomness = new Float32Array(cloudShaderParameters.count * 3)
 
     const colorInside = new THREE.Color(cloudShaderParameters.insideColor)
     const colorOutside = new THREE.Color(cloudShaderParameters.outsideColor)
 
     for (let i = 0; i < cloudShaderParameters.count; i++) {
         const i3 = i * 3
 
         // Position
         const radius = Math.random() * cloudShaderParameters.radius
         const branchAngle = ((i%cloudShaderParameters.branches)/cloudShaderParameters.branches) * 2 * Math.PI
         
         positions[i3] = Math.cos(branchAngle) * radius
         positions[i3+1] = 0
         positions[i3+2] = Math.sin(branchAngle) * radius
 
         randomness[i3] = (Math.pow(Math.random(), cloudShaderParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * cloudShaderParameters.randomRange
         randomness[i3+1] = (Math.pow(Math.random(), cloudShaderParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * cloudShaderParameters.randomRange
         randomness[i3+2] = (Math.pow(Math.random(), cloudShaderParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)) * cloudShaderParameters.randomRange
         
         // Color
         const mixedColor = colorInside.clone()
         mixedColor.lerp(colorOutside, radius / cloudShaderParameters.radius)
 
         colors[i3] = mixedColor.r
         colors[i3+1] = mixedColor.g
         colors[i3+2] = mixedColor.b
         
         // Scale
         scales[i] = Math.random() * cloudShaderParameters.scaleRange
     }
 
     cloudShaderGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
     cloudShaderGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
     cloudShaderGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
     cloudShaderGeometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))
 
     /**
      * Material
      */
        
     cloudShaderMaterial = new THREE.ShaderMaterial({
         depthWrite: false,
         blending: THREE.AdditiveBlending,
         vertexColors: true,
         vertexShader: cloudNoiseVertex,
         fragmentShader: cloudNoiseFragment,
         uniforms: {
             uSize: {value: cloudShaderParameters.size * renderer.getPixelRatio()},
             uTime: {value: 0},
             uTexture: {type: "t", value: cloudTexture},
             uResolution: {value: new THREE.Vector3(sizes.width, sizes.height, 1)},
         }
     })
 
     /**
      * Point
      */
     cloudShader = new THREE.Points(cloudShaderGeometry, cloudShaderMaterial)
     scene.add(cloudShader)
 }

/**
 * Just a cloud shader for now 
 */

const perlin = ImprovedNoise();
const vector = new THREE.Vector3();
let cloudGeometry = null
let cloudMaterial = null
let cloudVolume = null
let cloud = null
const generateCloud = () => {

    // Texture
    const data = new Uint8Array( cloudParameters.perlinSize * cloudParameters.perlinSize * cloudParameters.perlinSize );

    // Use perline noise to generate texture that will be use to map later
    let i = 0;
    for ( let z = 0; z < cloudParameters.perlinSize; z ++ ) {

        for ( let y = 0; y < cloudParameters.perlinSize; y ++ ) {

            for ( let x = 0; x < cloudParameters.perlinSize; x ++ ) {

                const d = 1.0 - vector.set( 
                    (x-(cloudParameters.perlinSize/2))/cloudParameters.perlinSize, 
                    (y-(cloudParameters.perlinSize/2))/cloudParameters.perlinSize, 
                    (z-(cloudParameters.perlinSize/2))/cloudParameters.perlinSize).length();
                data[ i ] = ( 128 + 128 * perlin.noise( x * cloudParameters.perlinScale*1.5, y * cloudParameters.perlinScale, z * cloudParameters.perlinScale) ) * d * d;
                i ++;
            }

        }

    }

    cloudVolume = new THREE.DataTexture3D( data, cloudParameters.perlinSize, cloudParameters.perlinSize, cloudParameters.perlinSize );
    cloudVolume.format = THREE.RedFormat;
    cloudVolume.minFilter = THREE.LinearFilter;
    cloudVolume.magFilter = THREE.LinearFilter;
    cloudVolume.unpackAlignment = 1;

    cloudGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0)
    // cloudGeometry = new THREE.SphereGeometry(1.0)
    cloudMaterial = new THREE.ShaderMaterial({
        vertexShader: volumetricCloudVertex,
        fragmentShader: volumetricCloudFragment,
        uniforms: {
            uTime: {value: 0},
            uColor: { value: new THREE.Color( cloudParameters.base ) },
            uVolume: { value: cloudVolume },
            uCameraPosition: { value: new THREE.Vector3() },
            uThreshold: { value: cloudParameters.threshold },
            uOpacity: { value: cloudParameters.opacity },
            uRange: { value: cloudParameters.range },
            uSteps: { value: cloudParameters.steps },
            uTestSize: {value: cloudParameters.size},
        },
        side: THREE.BackSide,
        transparent: true,
    })

    cloud = new THREE.Mesh(cloudGeometry, cloudMaterial)
    scene.add(cloud)
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
generalFolder.add(parameters, 'enableCloud').onChange(generateGalaxy)
generalFolder.add(parameters, 'enableCloudNoise').onChange(generateGalaxy)
generalFolder.add(parameters, 'enableCloudTexture').onChange(generateGalaxy)
generalFolder.add(parameters, 'enableStar').onChange(generateGalaxy)

const cloudFolder = gui.addFolder("Cloud")
cloudFolder.add( cloudParameters, 'threshold', 0, 1, 0.01 ).onFinishChange( generateGalaxy );
cloudFolder.add( cloudParameters, 'opacity', 0, 1, 0.01 ).onFinishChange( generateGalaxy );
cloudFolder.add( cloudParameters, 'range', 0, 1, 0.01 ).onFinishChange( generateGalaxy );
cloudFolder.add( cloudParameters, 'steps', 0, 200, 1 ).onFinishChange( generateGalaxy );
cloudFolder.add( cloudParameters, 'size', 0, 10, 0.01).onFinishChange( generateGalaxy );
cloudFolder.add( cloudParameters, 'perlinSize', 0, 256, 1).onFinishChange( generateGalaxy );
cloudFolder.add( cloudParameters, 'perlinScale', 0, 5, 0.01).onFinishChange( generateGalaxy );
cloudFolder.addColor(cloudParameters, 'base').onFinishChange( generateGalaxy )

const cloudShaderFolder = gui.addFolder("Cloud-Noise")
cloudShaderFolder.add(cloudShaderParameters, 'count').min(1).max(100000).step(1).onFinishChange(generateGalaxy)
cloudShaderFolder.add(cloudShaderParameters, 'size').min(0.01).max(1000).step(0.01).onFinishChange(generateGalaxy)
cloudShaderFolder.add(cloudShaderParameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
cloudShaderFolder.add(cloudShaderParameters, 'branches').min(2).max(10).step(1).onFinishChange(generateGalaxy)
cloudShaderFolder.add(cloudShaderParameters, 'randomRange').min(0).max(5).step(0.01).onFinishChange(generateGalaxy)
cloudShaderFolder.add(cloudShaderParameters, 'randomnessPower').min(1).max(10).step(0.1).onFinishChange(generateGalaxy)
cloudShaderFolder.add(cloudShaderParameters, 'scaleRange').min(0).max(10).step(0.1).onFinishChange(generateGalaxy)
cloudShaderFolder.addColor(cloudShaderParameters, 'insideColor').onFinishChange(generateGalaxy)
cloudShaderFolder.addColor(cloudShaderParameters, 'outsideColor').onFinishChange(generateGalaxy)

const textureFolder = gui.addFolder("Cloud-Texture")
textureFolder.add(textureParameters, 'count').min(1).max(1000).step(1).onFinishChange(generateGalaxy)
textureFolder.add(textureParameters, 'size').min(100).max(1000).step(1).onFinishChange(generateGalaxy)
textureFolder.add(textureParameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
textureFolder.add(textureParameters, 'branches').min(2).max(10).step(1).onFinishChange(generateGalaxy)
textureFolder.add(textureParameters, 'randomRange').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
textureFolder.add(textureParameters, 'randomnessPower').min(1).max(10).step(0.1).onFinishChange(generateGalaxy)
textureFolder.add(textureParameters, 'scaleRange').min(0).max(10).step(0.1).onFinishChange(generateGalaxy)
textureFolder.addColor(textureParameters, 'insideColor').onFinishChange(generateGalaxy)
textureFolder.addColor(textureParameters, 'outsideColor').onFinishChange(generateGalaxy)

const starFolder = gui.addFolder("Star")
starFolder.add(starParameters, 'count').min(1).max(100000).step(1).onFinishChange(generateGalaxy)
starFolder.add(starParameters, 'size').min(0.01).max(1000).step(0.01).onFinishChange(generateGalaxy)
starFolder.add(starParameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
starFolder.add(starParameters, 'branches').min(2).max(10).step(1).onFinishChange(generateGalaxy)
starFolder.add(starParameters, 'randomRange').min(0).max(5).step(0.01).onFinishChange(generateGalaxy)
starFolder.add(starParameters, 'randomnessPower').min(1).max(10).step(0.1).onFinishChange(generateGalaxy)
starFolder.add(starParameters, 'scaleRange').min(0).max(10).step(0.1).onFinishChange(generateGalaxy)
starFolder.addColor(starParameters, 'insideColor').onFinishChange(generateGalaxy)
starFolder.addColor(starParameters, 'outsideColor').onFinishChange(generateGalaxy)

/**
 * Animate
 */

generateGalaxy()

const clock = new THREE.Clock()

const stats = new Stats()
document.body.appendChild(stats.dom)
const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update material
    if (parameters.enableStar) {
        starMaterial.uniforms.uTime.value = elapsedTime
    }
    if (parameters.enableCloudNoise) {
        cloudShaderMaterial.uniforms.uTime.value = elapsedTime
    }
    if (parameters.enableCloudTexture) {
        textureMaterial.uniforms.uTime.value = elapsedTime
    }
    if (parameters.enableCloud) {
        cloud.material.uniforms.uTime.value = elapsedTime
        cloud.material.uniforms.uCameraPosition.value.copy(camera.position)
    }
    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Stats
    stats.update()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()