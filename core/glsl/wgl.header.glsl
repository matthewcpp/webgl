#version 300 es

precision mediump float;
precision mediump int;

const int WGL_LIGHT_DIRECTIONAL = 0;
const int WGL_LIGHT_POINT = 1;
const int WGL_LIGHT_SPOT = 2;

#define M_PI 3.1415926535897932384626433832795
#define WGL_MAX_LIGHTS 5

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
    wglLight lights[WGL_MAX_LIGHTS];
} wgl;

layout(std140) uniform wglObjectData {
    mat4 matrix;
    mat4 normal_matrix;
} wgl_object;
