#version 300 es

//!WGL_DEFINES

precision mediump float;
precision mediump int;

#ifdef WGL_TEXTURE_COORDS
in vec2 wgl_tex_coords0;
uniform sampler2D diffuse_sampler;
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
    // calculate ambient
    vec4 ambient_color = vec4(wgl.ambient_light_color * wgl.ambient_light_intensity, 1.0f);

    // calculate diffuse
    vec3 norm = normalize(normal);
    vec3 light_dir = normalize(wgl.lights[0].position - frag_pos);
    float diff = max(dot(norm, light_dir), 0.0f);
    vec4 light_diffuse = vec4(diff * wgl.lights[0].color, 1.0);

    // calculate specular
    vec3 view_dir = normalize(wgl.camera_world_pos - frag_pos);
    vec3 reflect_dir = reflect(-light_dir, norm);
    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), shininess);
    vec4 specular = vec4(specular_strength * spec * wgl.lights[0].color, 1.0f);

    vec4 object_diffuse = diffuse_color;
    #ifdef WGL_TEXTURE_COORDS
    object_diffuse *= texture(diffuse_sampler, wgl_tex_coords0);
    #endif

    // combine ambient, lighting diffuse, and object diffuse color
    finalColor = (ambient_color + light_diffuse + specular) * object_diffuse;

}

