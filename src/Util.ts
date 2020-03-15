import {ShaderData, ShaderInfo} from "./Shader.js";
import {Material, MaterialInfo} from "./Material.js";
import {WebGl} from "./WebGL.js";
import {MeshBufferData} from "./Mesh.js";

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

export async function downloadShader(shaderBasePath: string) {
    const timestamp = new Date().getTime();

    const shaderFiles = await Promise.all([
        jQuery.ajax(`${shaderBasePath}.vert.glsl?timestamp=${timestamp}`),
        jQuery.ajax(`${shaderBasePath}.frag.glsl?timestamp=${timestamp}`),
        jQuery.ajax(`${shaderBasePath}.info.json?timestamp=${timestamp}`)
    ]);

    const shaderData = new ShaderData();
    shaderData.vertexSource = shaderFiles[0];
    shaderData.fragmentSource = shaderFiles[1];
    shaderData.info = shaderFiles[2] as ShaderInfo;

    return shaderData;
}

function downloadArrayBuffer(url: string) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("GET", url);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response as ArrayBuffer);
            }
            else {
                reject(`Error loading: ${url}.  Response code: ${xhr.status}`);
            }
        };

        xhr.send();
    });
}

export async function downloadModel(url: string) {
    const modelData = await downloadArrayBuffer(url);
    return MeshBufferData.createFromArrayBuffer(modelData);
}

export async function downalodMaterial(url: string, webgl: WebGl) {
    const timestamp = new Date().getTime();

    const materialInfo = await jQuery.ajax(`${url}?timestamp=${timestamp}`) as MaterialInfo;

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

    const samplers = Object.keys(materialInfo.sampler2D);
    for (const sampler of samplers) {
        const textureHandle = materialInfo.sampler2D[sampler];

        let webglTexture = webgl.textures.get(textureHandle);
        if (!webglTexture) {
            webglTexture = webgl.createTexture(textureHandle, await downloadImage(textureHandle));
        }

        material.sampler2D.set(sampler, webglTexture);
    }

    return material;
}