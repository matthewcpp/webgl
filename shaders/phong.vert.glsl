#version 300 es

//!WGL_DEFINES

precision mediump float;

layout(location = 0) in vec4 wgl_position;

#ifdef WGL_TEXTURE_COORDS
layout(location = 2) in vec2 wgl_tex_coord0;
out vec2 tex_coords0;
#endif

layout(std140) uniform wglData {
    mat4 camera_projection;
    mat4 camera_view;
    vec3 ambient_light_color;
    float ambient_light_intensity;
} wgl;

uniform mat4 wgl_model;

void main() {
    gl_Position = wgl.camera_projection * wgl.camera_view * wgl_model * wgl_position;
}
