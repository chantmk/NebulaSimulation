uniform sampler2D uTexture;
uniform float uTime;

varying vec3 vColor;
varying vec2 vUv;
varying float vRotation;

void main()
{
    float rotationRad = vRotation * 3.14159265*2.0;
    float mid = 0.5;
    // vec2 rotation = vec2(cos(rotationRad) * (gl_PointCoord.x - mid) + sin(rotationRad) * (gl_PointCoord.y - mid) + mid,
    //                     cos(rotationRad) * (gl_PointCoord.y - mid) + sin(rotationRad) * (gl_PointCoord.x - mid) + mid);
    // vec2 rotation = vec2(cos(rotationRad) * (gl_PointCoord.x - 0.5) + 0.5, sin(rotationRad) * (gl_PointCoord.y - 0.5) + 0.5);
    // vec4 textureColor = texture2D(uTexture, rotation);
    // gl_FragColor = textureColor;

    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;

    // Final color
    vec3 color = mix(vec3(0.0), vColor, strength);
    vec4 textureColor = texture2D(uTexture, gl_PointCoord);
    vec4 finalColor = vec4(textureColor.xyz*color, textureColor.w);
    gl_FragColor = finalColor;
}