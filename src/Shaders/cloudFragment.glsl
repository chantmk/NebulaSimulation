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

// vec2 computeNearFar(vec3 origin, vec3 dir) {
//   // Ray is assumed to be in local coordinates, ie:
//   // ray = inverse(objectMatrix * invCameraMatrix) * ray
//   // Equation of ray: O + D * t

//   vec3 invRay = 1.0 / dir;

//   // Shortcut here, it should be: `aabbMin - ray.origin`.
//   // As we are always using normalized AABB, we can skip the line
//   // `(0, 0, 0) - ray.origin`.
//   vec3 tbottom = - invRay * origin;
//   vec3 ttop = invRay * (vec3(1.0) - origin);

//   vec3 tmin = min(ttop, tbottom);
//   vec3 tmax = max(ttop, tbottom);

//   float largestMin = max(max(tmin.x, tmin.y), max(tmin.x, tmin.z));
//   float smallestMax = min(min(tmax.x, tmax.y), min(tmax.x, tmax.z));

//   float near = largestMin;
//   float far = smallestMax;

//   return vec2(near, far);
// }

// float
// getSample(vec3 modelPosition)
// {
//   return texture(uVolume, modelPosition).r;
// }

// float
// getSample(float x, float y, float z)
// {
//   return getSample(vec3(x, y, z));
// }

// vec3 computeGradient(vec3 position, float step) {
//   return normalize(vec3(
//     getSample(position.x + step, position.y, position.z)
//     - getSample(position.x - step, position.y, position.z),
//     getSample(position.x, position.y + step, position.z)
//     - getSample(position.x, position.y - step, position.z),
//     getSample(position.x, position.y, position.z + step)
//     - getSample(position.x, position.y, position.z - step)
//   ));
// }

// void main()
// {
//   vec3 rayOrigin = vOrigin;
//   vec3 rayDir = normalize(vDirection);

//   // Solves a ray - Unit Box equation to determine the value of the closest and
//   // furthest intersections.
//   vec2 bound = computeNearFar(rayOrigin, rayDir);

//   // Moves the ray origin to the closest intersection.
//   // We don't want to spend time sampling nothing out of the volume!
//   rayOrigin = rayOrigin + bound.x * rayDir;
//   vec3 inc = 1.0 / abs( rayDir );
//   // Step size between two samples
//   float delta = min(inc.x, min(inc.y, inc.z)) / float(uSteps);
//   // The ray direction is now scaled by the step size.
//   rayDir = rayDir * delta;

// // Hardcoded for now: diffuse color of our cloud.
// vec3 baseColor = vec3(0.1);

// // Accumulation through the volume is stored in this variable.
// vec4 acc = vec4(0.0);

// vec3 lightDir = vec3(0., -1., 0.);

// float dist = bound.x;
// for (int i = 0; i < int(uSteps); ++i)
// {
//   // Get the voxel at the current ray position.
//   float s = texture(uVolume, rayOrigin).r;
//   // Clamps the sample value between `0.12` and `0.35` smoothly.
//   s = smoothstep(0.12, 0.35, s);
//   vec3 gradient = computeGradient(rayOrigin, delta);
//   float NdotL = max(0., dot(gradient, lightDir));

//   // The more we already accumulated, the less color we apply.
//   acc.rgb += (1.0 - acc.a) * s * baseColor;
//   // The more we already accumulated, the less opacity we apply.
//   acc.a += (1.0 - acc.a) * s;

//   // Early termination: after this threshold, accumulating becomes insignificant.
//   if (acc.a > 0.95) { break; }

//   rayOrigin += rayDir;
//     dist += delta;

//   if (dist >= bound.y) { break; }
// }

//   gl_FragColor = acc;
// }

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
    
    float delta = min(inv_dir.x, min(inv_dir.y, inv_dir.z));
    delta /= uSteps;
    vec3 size = vec3(textureSize(uVolume, 0)) + vec3(uTestSize);
    rayOrigin += rayDir * (1.0/size);

    vec4 color = vec4(uColor, 0.0);
    for (float t = bound.x; t<bound.y; t += delta) {
        float d = getSample(rayOrigin+0.5);
        d = smoothstep(uThreshold - uRange, uThreshold + uRange, d) * uOpacity;
        float col = shading(rayOrigin+1.5)*3.0 + ((rayOrigin.x + rayOrigin.y)*0.25)+0.2;
        color.rgb += (1.0 - color.a) * d * col;
        color.a += (1.0 - color.a) * d;
        if (color.a >= 0.95) break;
        rayOrigin += rayDir*delta;
    }
    if (color.a == 0.0) discard;
    gl_FragColor = color;
}