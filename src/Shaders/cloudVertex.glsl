uniform vec3 uCameraPosition;

varying vec3 vOrigin;
varying vec3 vDirection;

void main() {
    // vOrigin = vec3(inverse(modelMatrix) * vec4(uCameraPosition, 1.0)).xyz;
    vOrigin = uCameraPosition;
    vDirection = position - vOrigin;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}