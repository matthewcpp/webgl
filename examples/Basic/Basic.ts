import {WebGl} from "../../src/WebGL.js";
import * as GLTF from "../../src/GLTF/Loader.js";
import {Arcball} from "../../src/behaviors/Arcball.js";

let webGl: WebGl = null;

window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    webGl = new WebGl(glCanvas);
    webGl.canvas.oncontextmenu = () => false;

    const loader = new GLTF.Loader(webGl);
    //const nodes = await loader.load("triangle.gltf");
    const root = await loader.load("/models/Cube/Cube.gltf");

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(root[0]);
    webGl.mainCamera.node.components.behavior = arcball;

    webGl.start();
}

window.onresize = () => {
    webGl.canvasResized();
}