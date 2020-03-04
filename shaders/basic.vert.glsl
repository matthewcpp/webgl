#version 300 es

//!DEFINES

layout(location = 0) in vec4 aVertexPosition;
layout(location = 2) in vec2 aTextureCoord;

layout(std140) uniform UniformBuffer {
    mat4 modelView;
    mat4 projection;
} ubo;

uniform vec4 fragColor;

out vec4 vfragColor;
out vec2 vTextureCoord;

void main() {
    gl_Position = ubo.projection * ubo.modelView * aVertexPosition;

    vfragColor = fragColor;
    vTextureCoord = aTextureCoord;
}