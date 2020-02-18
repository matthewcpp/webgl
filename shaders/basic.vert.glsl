attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec4 fragColor;

varying vec4 vfragColor;
varying vec2 vTextureCoord;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    vfragColor = fragColor;
    vTextureCoord = aTextureCoord;
}