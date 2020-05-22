import {ShaderData, ShaderInfo} from "./Shader.js";
import {Material, MaterialInfo} from "./Material.js";
import {WebGl} from "./WebGL.js";
import {MeshBufferData} from "./Mesh.js";

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
        fetch(`${shaderBasePath}.vert.glsl?timestamp=${timestamp}`),
        fetch(`${shaderBasePath}.frag.glsl?timestamp=${timestamp}`),
        fetch(`${shaderBasePath}.info.json?timestamp=${timestamp}`)
    ]);

    const shaderData = new ShaderData();
    shaderData.vertexSource = await shaderFiles[0].text();
    shaderData.fragmentSource = await shaderFiles[1].text();
    shaderData.info = await shaderFiles[2].json() as ShaderInfo;

    return shaderData;
}

export async function downloadModel(url: string) {
    const modelResponse = await fetch(url);
    if (modelResponse.status !== 200)
        throw new Error(`Unable to download model from: ${url}`);

    const modelData = await modelResponse.arrayBuffer();
    return MeshBufferData.createFromArrayBuffer(modelData);
}

export async function downalodMaterial(url: string, webgl: WebGl) {
    const timestamp = new Date().getTime();

    const materialResponse = await fetch(`${url}?timestamp=${timestamp}`);
    const materialInfo = await materialResponse.json() as MaterialInfo;

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
