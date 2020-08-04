import {ShaderData} from "./Shader";

export function downloadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let image = new Image();

        image.onload = () => {
            resolve(image);
        };

        image.src = url;
    });
}

export async function downloadShaderSource(shaderBasePath: string) {
    const timestamp = new Date().getTime();

    const shaderFiles = await Promise.all([
        fetch(`${shaderBasePath}.vert.glsl?timestamp=${timestamp}`),
        fetch(`${shaderBasePath}.frag.glsl?timestamp=${timestamp}`),
    ]);

    const shaderSource = await Promise.all([
        shaderFiles[0].text(),
        shaderFiles[1].text()
    ]);

    const shaderData = new ShaderData();
    shaderData.vertexSource = shaderSource[0];
    shaderData.fragmentSource = shaderSource[1];

    return shaderData;
}