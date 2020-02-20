import {ShaderData, ShaderInfo} from "./Shader.js";
import {Material, MaterialInfo} from "./Material.js";
import {WebGl} from "./WebGL.js";
import {MeshBufferData, MeshVertexAttributes} from "./Mesh.js";

import * as vec3 from "../external/gl-matrix/vec3.js"

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

    const dataView = new DataView(modelData);

    let dataIndex = 0;
    const vertexAttributes = dataView.getUint32(dataIndex, true) as MeshVertexAttributes;
    dataIndex += 4;

    const vertexCount = dataView.getUint32(dataIndex, true);
    dataIndex += 4;

    const vertexBufferSize = dataView.getUint32(dataIndex, true);
    dataIndex += 4;

    const vertexBuffer = new Float32Array(modelData, dataIndex, vertexBufferSize / 4);
    dataIndex += (vertexBufferSize);

    const elementCount = dataView.getUint32(dataIndex, true);
    dataIndex += 4;

    const elementSize = dataView.getUint32(dataIndex, true);
    dataIndex += 4;

    // not currently used
    // const elementDataSize = dataView.getUint32(dataIndex, true);
    dataIndex += 4;

    const elementBuffer = (elementSize === 2) ? new Uint16Array(modelData, dataIndex, elementCount) : new Uint32Array(modelData, dataIndex, elementCount)
    dataIndex += elementCount + elementSize;

    const min = vec3.fromValues(dataView.getFloat32(dataIndex, true), dataView.getFloat32(dataIndex + 4, true), dataView.getFloat32(dataIndex + 8, true));
    dataIndex += 12;

    const max = vec3.fromValues(dataView.getFloat32(dataIndex, true), dataView.getFloat32(dataIndex + 4, true), dataView.getFloat32(dataIndex + 8, true));
    dataIndex += 12;

    return new MeshBufferData(vertexAttributes, vertexBuffer, vertexCount, elementBuffer, elementCount, min, max);
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