import {WebGl} from "../../src/WebGL.js";
import * as GLTF from "../../src/GLTF/Loader.js";

console.log("hello world")

let webGl: WebGl = null;

window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    webGl = new WebGl(glCanvas);

    const loader = new GLTF.Loader(webGl);
    //const nodes = await loader.load("triangle.gltf");
    await loader.load("/models/Cube/Cube.gltf");

    webGl.start();
}

window.onresize = () => {
    webGl.canvasResized();
}