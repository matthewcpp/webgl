#version 300 es

//!DEFINES

precision mediump float;

in vec4 vfragColor;
in vec2 vTextureCoord;

uniform sampler2D uSampler;

out vec4 outColor;

void main() {
    outColor = texture(uSampler, vTextureCoord) * vfragColor;
}