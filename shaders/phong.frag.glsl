#version 300 es

//!WGL_DEFINES

precision mediump float;
precision mediump int;

#ifdef WGL_TEXTURE_COORDS
in vec2 wgl_tex_coords0;
uniform sampler2D diffuse_sampler;
uniform sampler2D specular_sampler;
uniform sampler2D emission_sampler;
#endif

struct wglLight {
    vec3 position;
    vec3 color;
};

layout(std140) uniform wglData {
    mat4 camera_projection;
    mat4 camera_view;
    vec3 camera_world_pos;
    vec3 ambient_light_color;
    float ambient_light_intensity;
    wglLight lights[1];
    uint light_count;
} wgl;

out vec4 finalColor;

// phong params
uniform vec4 diffuse_color;
uniform float specular_strength;
uniform float shininess;


in vec3 normal;
in vec3 frag_pos;

void main() {
    vec4 object_diffuse_color = diffuse_color;
    #ifdef WGL_TEXTURE_COORDS
    object_diffuse_color *= texture(diffuse_sampler, wgl_tex_coords0);
    #endif

    // calculate ambient
    vec4 ambient_color = vec4(wgl.ambient_light_color * wgl.ambient_light_intensity, 1.0f) * object_diffuse_color;

    // calculate diffuse
    vec3 norm = normalize(normal);
    vec3 light_dir = normalize(wgl.lights[0].position - frag_pos);
    float diff = max(dot(norm, light_dir), 0.0f);
    vec4 light_diffuse_color = vec4(diff * wgl.lights[0].color, 1.0f) * object_diffuse_color;

    // calculate specular
    vec3 view_dir = normalize(wgl.camera_world_pos - frag_pos);
    vec3 reflect_dir = reflect(-light_dir, norm);
    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), shininess);
    vec4 specular_color = vec4(specular_strength * spec * wgl.lights[0].color , 1.0f);

    #ifdef WGL_TEXTURE_COORDS
    specular_color *= texture(specular_sampler, wgl_tex_coords0);
    #endif

    // calculate emission
    #ifdef WGL_TEXTURE_COORDS
    vec4 emission = texture(emission_sampler, wgl_tex_coords0);
    #else
    vec4 emission = vec4(0.0f);
    #endif

    finalColor = ambient_color + light_diffuse_color + specular_color + emission;
}

