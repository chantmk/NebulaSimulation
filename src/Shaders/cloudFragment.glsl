precision highp float;
precision highp sampler3D;

varying vec3 vOrigin;
varying vec3 vDirection;

uniform vec3 uColor;
uniform sampler3D uVolume;
uniform float uThreshold;
uniform float uRange;
uniform float uOpacity;
uniform float uSteps;

vec2 computeHitBox(vec3 origin, vec3 dir) {
    vec3 inv_dir = 1.0/dir;
    vec3 boxMin = (vec3(-0.5) - origin) * inv_dir;
    vec3 boxMax = (vec3(0.5) - origin) * inv_dir;
    vec3 tMin = min(boxMin, boxMax);
    vec3 tMax = max(boxMin, boxMax);
    float near = max(tMin.x, max(tMin.y, tMin.z));
    float far = min(tMax.x, min(tMax.y, tMax.z));
    return vec2(near, far);
}

float sample1( vec3 p ) {
    return texture( uVolume, p ).r;
}
float shading( vec3 coord ) {
    float step = 0.01;
    return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
}

void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bound = computeHitBox(vOrigin, rayDir);
    if (bound.x > bound.y) discard;
    // if x is negative our camera is in between
    bound.x = max(bound.x, 0.0);

    // Position that intersect
    vec3 p = vOrigin + bound.x*rayDir;
    vec3 inc = 1.0 / abs(rayDir);
    
    float delta = min(inc.x, min(inc.y, inc.z));
    delta /= uSteps;
    vec3 size = vec3(textureSize(uVolume, 0));
    p += rayDir * (1.0/size);

    vec4 color = vec4(uColor, 0.0);
    for (float t = bound.x; t<bound.y; t += delta) {
        float d = sample1(p);
        d = smoothstep(uThreshold - uRange, uThreshold + uRange, d) * uOpacity;
        float col = shading(p) + ((p.x + p.y));
        color.rgb += (1.0 - color.a) * d * col;
        color.a += (1.0 - color.a) * d;
        if (color.a >= 0.95) break;
        p += rayDir*delta;
    }
    if (color.a == 0.0) discard;
    gl_FragColor = color;
}