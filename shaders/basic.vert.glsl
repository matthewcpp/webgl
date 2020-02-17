attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec4 fragColor;
varying vec4 vfragColor;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vfragColor = fragColor;
    //vfragColor = vec4(0.2, 0.845, 0.7, 1.0);
}