#version 300 es

precision mediump float;

varying vec4 vfragColor;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main() {
    gl_FragColor = texture2D(uSampler, vTextureCoord) * vfragColor;
}