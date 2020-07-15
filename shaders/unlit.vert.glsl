#version 300 es

//!WGL_DEFINES

layout(location = 0) in vec4 wgl_position;

#ifdef WGL_TEXTURE_COORDS
layout(location = 2) in vec2 wgl_tex_coord0;
out vec2 wgl_tex_coords0;
#endif

layout(std140) uniform wglData {
    mat4 camera_projection;
    mat4 camera_view;
} wgl;

layout(std140) uniform wglModelData {
    mat4 matrix;
    mat4 normal_matrix;
} wgl_model;

out vec4 color;

void main() {
    gl_Position = wgl.camera_projection * wgl.camera_view * wgl_model.matrix * wgl_position;

    #ifdef WGL_TEXTURE_COORDS
        wgl_tex_coords0 = wgl_tex_coord0;
    #endif
}
