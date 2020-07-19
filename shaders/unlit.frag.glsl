#version 300 es

//!WGL_DEFINES

precision mediump float;

out vec4 final_color;
uniform vec4 frag_color;

#ifdef WGL_TEXTURE_COORDS
in vec2 wgl_tex_coords0;
uniform sampler2D sampler0;
#endif

void main() {
    #ifdef WGL_TEXTURE_COORDS
        final_color = texture(sampler0, wgl_tex_coords0) * frag_color;
    #else
        final_color = frag_color;
    #endif
}

