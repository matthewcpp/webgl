out vec4 final_color;
uniform vec4 diffuse_color;

#ifdef WGL_TEXTURE_COORDS0
in vec2 wgl_tex_coords0;
#endif

#ifdef WGL_UNLIT_DIFFUSE_MAP
uniform sampler2D diffuse_sampler;
#endif

void main() {
    #if defined(WGL_TEXTURE_COORDS0) && defined(WGL_UNLIT_DIFFUSE_MAP)
        final_color = texture(diffuse_sampler, wgl_tex_coords0) * diffuse_color;
    #else
        final_color = diffuse_color;
    #endif
}

