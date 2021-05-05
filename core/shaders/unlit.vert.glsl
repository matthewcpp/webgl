#version 300 es

precision mediump float;
precision mediump int;

#include "wgl.h.glsl"

layout(location = 0) in vec4 wgl_position;

#ifdef WGL_TEXTURE_COORDS
layout(location = 2) in vec2 wgl_tex_coord0;
out vec2 wgl_tex_coords0;
#endif

out vec4 color;

void main() {
    gl_Position = wgl.camera_projection * wgl.camera_view * wgl_model.matrix * wgl_position;

    #ifdef WGL_TEXTURE_COORDS
        wgl_tex_coords0 = wgl_tex_coord0;
    #endif
}
