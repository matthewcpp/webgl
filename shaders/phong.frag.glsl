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
    float cone_inner_angle;
    vec3 direction;
    float cone_outer_angle;
    vec3 color;
    float align2;
};

layout(std140) uniform wglData {
    mat4 camera_projection;
    mat4 camera_view;
    vec3 camera_world_pos;
    vec3 ambient_light_color;
    float ambient_light_intensity;
    wglLight lights[MAX_LIGHTS];
    int light_count;
} wgl;

layout(std140) uniform wglModelData {
    mat4 matrix;
    mat4 normal_matrix;
} wgl_model;

// ---------------------

#ifdef WGL_TEXTURE_COORDS
in vec2 wgl_tex_coords0;
uniform sampler2D diffuse_sampler;
uniform sampler2D specular_sampler;
uniform sampler2D emission_sampler;
#endif

out vec4 finalColor;

// phong params
uniform vec4 diffuse_color;
uniform float specular_strength;
uniform float shininess;

in vec3 normal;
in vec3 frag_pos;

vec4 calculateSpecular(wglLight light, vec3 light_dir) {
    vec3 norm = normalize(normal);
    vec3 view_dir = normalize(wgl.camera_world_pos - frag_pos);
    vec3 reflect_dir = reflect(-light_dir, norm);
    float spec = pow(max(dot(view_dir, reflect_dir), 0.0f), shininess);
    vec4 specular_color = vec4(specular_strength * spec * light.color , 1.0f);

    #ifdef WGL_TEXTURE_COORDS
    specular_color *= texture(specular_sampler, wgl_tex_coords0);
    #endif

    return specular_color;
}

vec4 directionalLight(wglLight light, vec4 object_diffuse_color) {
    vec3 norm = normalize(normal);
    vec3 light_dir = normalize(-light.direction); // note that direction is specified from source, but our calculations following assume light dir is to the source.
    float diff = max(dot(norm, light_dir), 0.0f);
    vec4 diffuse_color = vec4(diff * light.color, 1.0f) * object_diffuse_color;

    return diffuse_color + calculateSpecular(light, light_dir);
}

// http://hyperphysics.phy-astr.gsu.edu/hbase/vision/isql.html
vec4 pointLight(wglLight light, vec4 object_diffuse_color) {
    float distance = distance(light.position, frag_pos);
    float intensity = light.range / (4.0f * M_PI * (distance * distance));
    intensity *= light.intensity;

    vec3 norm = normalize(normal);
    vec3 light_dir = normalize(light.position - frag_pos);
    float diff = max(dot(norm, light_dir), 0.0f);
    vec4 diffuse_color = vec4(diff * light.color, 1.0f) * object_diffuse_color * intensity;

    return diffuse_color + calculateSpecular(light, light_dir) * intensity;
}

void main() {
    vec4 object_diffuse_color = diffuse_color;
    #ifdef WGL_TEXTURE_COORDS
    object_diffuse_color *= texture(diffuse_sampler, wgl_tex_coords0);
    #endif

    // calculate ambient
    vec4 frag_color = vec4(wgl.ambient_light_color * wgl.ambient_light_intensity, 1.0f) * object_diffuse_color;

    // calculate diffuse
    for (int i = 0; i < wgl.light_count; i++) {
        switch(wgl.lights[i].type) {
            case WGL_LIGHT_DIRECTIONAL:
                frag_color += directionalLight(wgl.lights[i], object_diffuse_color);
                break;

            case WGL_LIGHT_POINT:
                frag_color += pointLight(wgl.lights[i], object_diffuse_color);
                break;
        }
    }

    // calculate emission
    #ifdef WGL_TEXTURE_COORDS
    vec4 emission = texture(emission_sampler, wgl_tex_coords0);
    #else
    vec4 emission = vec4(0.0f);
    #endif

    frag_color += emission;

    finalColor = frag_color;
}

