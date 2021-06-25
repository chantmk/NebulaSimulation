uniform vec3 uCameraPosition;
uniform float uTime;
uniform float uRandomness;

varying vec3 vOrigin;
varying vec3 vDirection;
varying vec3 vPosition;

void main() {
    vPosition = position;
    vOrigin = uCameraPosition;
    vDirection = position - vOrigin;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
}