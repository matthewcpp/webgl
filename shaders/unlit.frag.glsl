#version 300 es

//!WGL_DEFINES

precision mediump float;

in vec4 color;

out vec4 finalColor;

#ifdef WGL_TEXTURE_COORDS
in vec2 tex_coords0;
uniform sampler2D sampler0;
#endif

void main() {
    #ifdef WGL_TEXTURE_COORDS
        finalColor = texture(sampler0, tex_coords0) * color;
    #else
        finalColor = color;
    #endif
}

