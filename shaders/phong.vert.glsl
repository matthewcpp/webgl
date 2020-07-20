#version 300 es

//!WGL_DEFINES

precision mediump float;
precision mediump int;

// Standard Shader Header
const int WGL_LIGHT_DIRECTIONAL = 0;
const int WGL_LIGHT_POINT = 1;
const int WGL_LIGHT_SPOT = 2;

#define M_PI 3.1415926535897932384626433832795
#define MAX_LIGHTS 5

struct wglLight {
    int type;
    float range;
    float intensity;
    float align1;
    vec3 position;
    float spot_inner_angle;
    vec3 direction;
    float spot_outer_angle;
    vec3 color;
    float align2;
};

layout(std140) uniform wglData {
    mat4 camera_projection;
    mat4 camera_view;
    vec3 camera_world_pos;
    float ambient_light_intensity;
    vec3 ambient_light_color;
    int light_count;
    wglLight lights[MAX_LIGHTS];
} wgl;

layout(std140) uniform wglModelData {
    mat4 matrix;
    mat4 normal_matrix;
} wgl_model;

// ---------------------

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
