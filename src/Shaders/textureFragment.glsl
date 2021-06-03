uniform sampler2D uTexture;
uniform float uTime;

varying vec3 vColor;
varying vec2 vUv;

void main()
{
    gl_FragColor = texture2D(uTexture, gl_PointCoord);
}