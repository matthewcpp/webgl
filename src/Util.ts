import {ShaderData, ShaderInfo} from "./Shader.js";
import {Material, MaterialInfo} from "./Material.js";
import {WebGl} from "./WebGL.js";

import "../external/jquery.min.js";

export function downloadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let image = new Image();

        image.onload = () => {
            resolve(image);
        };

        image.src = url;
    });
}

export async function downloadShader(name: string) {
    const shaderFiles = await Promise.all([
        jQuery.ajax(`/shaders/${name}.vert.glsl`),
        jQuery.ajax(`/shaders/${name}.frag.glsl`),
        jQuery.ajax(`/shaders/${name}.json`)
    ]);

    const shaderData = new ShaderData();
    shaderData.vertexSource = shaderFiles[0];
    shaderData.fragmentSource = shaderFiles[1];
    shaderData.info = shaderFiles[2] as ShaderInfo;

    return shaderData;
}

export async function downalodMaterial(url: string, webgl: WebGl) {
    const materialInfo = await jQuery.ajax(url) as MaterialInfo;

    let shader = webgl.shaders.get(materialInfo.shader);
    if (!shader) {
        shader = webgl.createShader(materialInfo.shader, await downloadShader(materialInfo.shader));
    }

    const material = new Material(shader);

    const vec4fs = Object.keys(materialInfo.vec4f);
    for (const vec4f of vec4fs) {
        const values = materialInfo.vec4f[vec4f];

        material.vec4.set(vec4f, values);
    }

    const textures = Object.keys(materialInfo.texture);
    for (const texture of textures) {
        const textureName = materialInfo.texture[texture];

        let webglTexture = webgl.textures.get(textureName);
        if (!webglTexture) {
            webglTexture = webgl.createTexture(texture, await downloadImage(`/textures/${textureName}`));
        }

        material.texture.set(texture, webglTexture);
    }

    return material;
}