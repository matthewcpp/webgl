#version 300 es

//!WGL_DEFINES

layout(location = 0) in vec4 wgl_position;

#ifdef WGL_TEXTURE_COORDS
layout(location = 2) in vec2 wgl_tex_coord0;
out vec2 tex_coords0;
#endif

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

    #ifdef WGL_TEXTURE_COORDS
        tex_coords0 = wgl_tex_coord0;
    #endif
}
