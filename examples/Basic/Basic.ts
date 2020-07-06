import {WebGl} from "../../src/WebGL.js";
import {GLTFLoader} from "../../src/GLTF/Loader.js";
import {UnlitParams} from "../../src/shader/Unlit.js";
import * as vec4 from "../../external/gl-matrix/vec4.js";

console.log("hello world")

let webGl: WebGl = null;

window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    webGl = new WebGl(glCanvas);

    const loader = new GLTFLoader(webGl);
    //const nodes = await loader.load("triangle.gltf");
    const nodes = await loader.load("/models/Cube/Cube.gltf");

    const triangle = nodes[0];
    const params = triangle.components.material.params as UnlitParams;
    vec4.set(params.color, 0.0, 1.0, 0.0, 1.0);

    webGl.start();
}