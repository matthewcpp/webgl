import {ShaderData, ShaderInfo} from "./Shader.js";

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