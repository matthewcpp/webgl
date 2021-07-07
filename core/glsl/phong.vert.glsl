#ifdef WGL_TEXTURE_COORDS0
out vec2 wgl_tex_coords0;
#endif

out vec3 normal;
out vec3 frag_pos;

void main() {
    gl_Position = wgl.camera_projection * wgl.camera_view * wgl_object.matrix * wgl_position;

    #ifdef WGL_TEXTURE_COORDS0
    wgl_tex_coords0 = wgl_tex_coord0;
    #endif

    normal = mat3(wgl_object.normal_matrix) * wgl_normal;
    frag_pos = (wgl_object.matrix * wgl_position).xyz;
}
