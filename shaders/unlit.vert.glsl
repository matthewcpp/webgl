#version 300 es

layout(location = 0) in vec4 wgl_position;

layout(std140) uniform wglData {
    mat4 camera_projection;
    mat4 camera_view;
} wgl;

uniform mat4 wgl_mvp;

uniform vec4 frag_color;

out vec4 color;

void main() {
    gl_Position = wgl.camera_projection * wgl.camera_view * wgl_mvp * wgl_position;
    color = frag_color;
}
