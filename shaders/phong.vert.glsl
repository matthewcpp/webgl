#version 300 es

//!WGL_DEFINES

precision mediump float;
precision mediump int;

layout(location = 0) in vec4 wgl_position;
layout(location = 1) in vec3 wgl_normal;

#ifdef WGL_TEXTURE_COORDS
layout(location = 2) in vec2 wgl_tex_coord0;
out vec2 wgl_tex_coords0;
#endif

struct wglLight {
    vec3 position;
    vec3 color;
};

layout(std140) uniform wglData {
    mat4 camera_projection;
    mat4 camera_view;
    vec3 ambient_light_color;
    float ambient_light_intensity;
    wglLight lights[1];
    uint light_count;
} wgl;

layout(std140) uniform wglModelData {
    mat4 matrix;
    mat4 normal_matrix;
} wgl_model;

out vec3 normal;
out vec3 frag_pos;

void main() {
    gl_Position = wgl.camera_projection * wgl.camera_view * wgl_model.matrix * wgl_position;

    #ifdef WGL_TEXTURE_COORDS
    wgl_tex_coords0 = wgl_tex_coord0;
    #endif

    normal = mat3(wgl_model.normal_matrix) * wgl_normal;
    frag_pos = (wgl_model.matrix * wgl_position).xyz;
}
