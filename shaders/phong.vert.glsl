#version 300 es

precision mediump float;
precision mediump int;

#include "wgl.h.glsl"

layout(location = 0) in vec4 wgl_position;
layout(location = 1) in vec3 wgl_normal;

#ifdef WGL_TEXTURE_COORDS
layout(location = 2) in vec2 wgl_tex_coord0;
out vec2 wgl_tex_coords0;
#endif

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
