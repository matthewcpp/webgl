#ifdef WGL_TEXTURE_COORDS0
in vec2 wgl_tex_coords0;
#endif

#ifdef WGL_PHONG_DIFFUSE_MAP
uniform sampler2D diffuse_sampler;
#endif

#ifdef WGL_PHONG_SPECULAR_MAP
uniform sampler2D specular_sampler;
#endif

#ifdef WGL_PHONG_EMISSION_MAP
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

    #if defined(WGL_TEXTURE_COORDS0) && defined(WGL_PHONG_SPECULAR_MAP)
    specular_color *= texture(specular_sampler, wgl_tex_coords0);
    #endif

    return specular_color;
}

vec4 directionalLight(wglLight light, vec4 object_diffuse_color) {
    vec3 norm = normalize(normal);
    vec3 light_dir = normalize(-light.direction); // note that direction is specified from source, but our calculations following assume light dir is to the source.
    float diff = max(dot(norm, light_dir), 0.0f);
    vec4 diffuse_color = vec4(diff * light.color, 1.0f) * object_diffuse_color;

    diffuse_color += calculateSpecular(light, light_dir);
    return clamp(diffuse_color, 0.0f, 1.0f);
}


vec4 pointLight(wglLight light, vec4 object_diffuse_color) {
    float distance = distance(light.position, frag_pos);

    // approximate inverse square law
    float attenuation = clamp(1.0 - (distance * distance) / (light.range * light.range), 0.0, 1.0);
    attenuation *= attenuation;

    //float b = 1.0 / (light.range * light.range * 0.01);
    //attenuation = 1.0 / (1.0 + (b * distance * distance));

    vec3 norm = normalize(normal);
    vec3 light_dir = normalize(light.position - frag_pos);
    float diff = max(dot(norm, light_dir), 0.0f);
    vec4 diffuse_color = vec4(diff * light.color * light.intensity, 1.0f) * object_diffuse_color;

    diffuse_color += calculateSpecular(light, light_dir) * attenuation;

    return clamp(diffuse_color, 0.0f, 1.0f);
}

vec4 spotLight(wglLight light, vec4 object_diffuse_color) {
    vec3 frag_to_light = normalize(light.position - frag_pos);
    float theta = dot(frag_to_light, -light.direction);

    float angle = acos(theta) * 180.0 / M_PI;
    float epsilon = light.spot_inner_angle - light.spot_outer_angle;
    float spot_modifier = smoothstep(0.0, 1.0, (angle - light.spot_outer_angle) / epsilon);

    vec4 diffuse_color = pointLight(light, object_diffuse_color) * spot_modifier;

    return clamp(diffuse_color, 0.0f, 1.0f);
}

void main() {
    vec4 object_diffuse_color = diffuse_color;
    #if defined(WGL_TEXTURE_COORDS0) && defined(WGL_PHONG_DIFFUSE_MAP)
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

            case WGL_LIGHT_SPOT:
                frag_color += spotLight(wgl.lights[i], object_diffuse_color);
                break;
        }
    }

    // calculate emission
    #if defined(WGL_TEXTURE_COORDS0) && defined(WGL_PHONG_EMISSION_MAP)
    vec4 emission = texture(emission_sampler, wgl_tex_coords0);
    frag_color += emission;
    #endif

    finalColor = frag_color;
}

