import {WebGl} from "../../src/WebGL.js";
import {Node} from "../../src/Node.js";
import * as GLTF from "../../src/GLTF/Loader.js";
import {Arcball} from "../../src/behaviors/Arcball.js";
import {Material} from "../../src/Material.js";
import {MeshInstance} from "../../src/Mesh.js";

let webGl: WebGl = null;

window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    webGl = new WebGl(glCanvas);
    webGl.canvas.oncontextmenu = () => false;

    const loader = new GLTF.Loader(webGl);
    const roots = await loader.load("/models/Cube/Cube.gltf");

    const unlitCube = new Node();
    unlitCube.position[2] = -2.5;
    unlitCube.components.meshInstance = new MeshInstance(
        roots[0].components.meshInstance.mesh,
        [ new Material(await webGl.defaultShaders.unlit())]);
    webGl.rootNode.addChild(unlitCube);

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(roots[0]);
    webGl.mainCamera.node.components.behavior = arcball;

    webGl.start();
}

window.onresize = () => {
    webGl.canvasResized();
}