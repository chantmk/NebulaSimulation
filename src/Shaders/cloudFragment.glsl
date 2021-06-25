precision highp float;
precision highp sampler3D;

varying vec3 vOrigin;
varying vec3 vDirection;
varying vec3 vPosition;

uniform vec3 uColor;
uniform sampler3D uVolume;
uniform float uThreshold;
uniform float uRange;
uniform float uOpacity;
uniform float uSteps;
uniform float uTestSize;
uniform float uTime;


vec2 computeHitBox(vec3 origin, vec3 dir) {
    float boxSize = 0.5;
    vec3 inv_dir = 1.0/dir;
    vec3 boxMin = (vec3(-boxSize) - origin) * inv_dir;
    vec3 boxMax = (vec3(boxSize) - origin) * inv_dir;
    vec3 tMin = min(boxMin, boxMax);
    vec3 tMax = max(boxMin, boxMax);
    float near = max(tMin.x, max(tMin.y, tMin.z));
    float far = min(tMax.x, min(tMax.y, tMax.z));
    return vec2(near, far);
}

float getSample( vec3 p ) {
    return texture( uVolume, p ).x + sin(uTime)*0.05;
}
float shading( vec3 coord ) {
    float step = 0.01;
    return getSample( coord + vec3( - step ) ) - getSample( coord + vec3( step ) );
}

void main() {
    // Get direction 
    vec3 rayDir = normalize(vDirection);
    vec3 rayOrigin = vOrigin;

    // Find bound of the hitbox
    vec2 bound = computeHitBox(vOrigin, rayDir);
    if (bound.x > bound.y) discard;
    // if x is negative our camera is in between so clamp it to zero
    bound.x = max(bound.x, 0.0);

    // Position that intersect
    rayOrigin = vOrigin + bound.x*rayDir;
    vec3 inv_dir = 1.0 / abs(rayDir);
    
    // Step that need to take
    float delta = min(inv_dir.x, min(inv_dir.y, inv_dir.z));
    delta /= uSteps;

    // Texture size
    vec3 size = vec3(textureSize(uVolume, 0)) + vec3(uTestSize);
    rayOrigin += rayDir * (1.0/size);

    vec4 color = vec4(uColor, 0.0);
    for (float t = bound.x; t<bound.y; t += delta) {
        
        // Volume at ray position
        float d = getSample(rayOrigin+0.5);

        // Clamp the volume value in between range of threshold then apply with opacity
        d = smoothstep(uThreshold - uRange, uThreshold + uRange, d) * uOpacity;
        float col = shading(rayOrigin) + ((rayOrigin.x + rayOrigin.y));

        // Less color when accumulate volume
        color.rgb += (1.0 - color.a) * d * col;

        // Less opacity when accumulate volume
        color.a += (1.0 - color.a) * d;

        if (color.a >= 0.95) break;
        rayOrigin += rayDir*delta;
    }
    if (color.a <= 0.05) discard;
    gl_FragColor = color;
}