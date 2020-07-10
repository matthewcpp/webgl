#version 300 es

//!WGL_DEFINES

precision mediump float;

out vec4 finalColor;

#ifdef WGL_TEXTURE_COORDS
in vec2 tex_coords0;
uniform sampler2D sampler0;
#endif

uniform vec4 diffuse_color;

layout(std140) uniform wglData {
    mat4 camera_projection;
    mat4 camera_view;
    vec3 ambient_light_color;
    float ambient_light_intensity;
} wgl;

void main() {
    vec3 ambient_color = wgl.ambient_light_color * wgl.ambient_light_intensity;
    vec4 base_color = vec4(ambient_color, 1.0) * diffuse_color;


    #ifdef WGL_TEXTURE_COORDS
    finalColor = texture(sampler0, tex_coords0) * base_color;
    #else
    finalColor = base_color;
    #endif
}

