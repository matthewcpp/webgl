#version 300 es

//!WGL_DEFINES

precision mediump float;
precision mediump int;

#ifdef WGL_TEXTURE_COORDS
in vec2 tex_coords0;
uniform sampler2D sampler0;
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

out vec4 finalColor;

uniform vec4 diffuse_color;

in vec3 normal;
in vec3 frag_pos;

void main() {
    vec4 ambient_color = vec4(wgl.ambient_light_color * wgl.ambient_light_intensity, 1.0f);

    // calculate diffuse lighting value
    vec3 norm = normalize(normal);
    vec3 light_dir = normalize(wgl.lights[0].position - frag_pos);
    float diff = max(dot(norm, light_dir), 0.0f);
    vec4 light_diffuse = vec4(diff * wgl.lights[0].color, 1.0);

    // combine ambient, lighting diffuse, and object diffuse color
    vec4 base_color = (ambient_color + light_diffuse) * diffuse_color;

    #ifdef WGL_TEXTURE_COORDS
    finalColor = texture(sampler0, tex_coords0) * base_color;
    #else
    finalColor = base_color;
    #endif
}

