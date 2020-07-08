import {WebGl} from "../../src/WebGL.js";
import {Node} from "../../src/Node.js";
import * as GLTF from "../../src/GLTF/Loader.js";
import {Arcball} from "../../src/behaviors/Arcball.js";
import {Material} from "../../src/Material.js";
import {MeshInstance} from "../../src/Mesh.js";

import * as vec4 from "../../external/gl-matrix/vec4.js"
import {UnlitParams} from "../../src/shader/Unlit.js";

let webGl: WebGl = null;

window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;

    webGl = new WebGl(glCanvas);
    await webGl.init();

    webGl.canvas.oncontextmenu = () => false;

    const loader = new GLTF.Loader(webGl);
    const roots = await loader.load("/models/Cube/Cube.gltf");

    const texturedCube = roots[0];
    const unlitCube = new Node();
    unlitCube.position[2] = -2.5;

    const unlitMaterial = new Material(await webGl.defaultShaders.unlit());
    const params = unlitMaterial.params as UnlitParams;
    vec4.set(params.color, 0.875, 1.0, 0.0, 1.0);

    unlitCube.components.meshInstance = new MeshInstance(
        texturedCube.components.meshInstance.mesh,
        [unlitMaterial]
    );

    webGl.rootNode.addChild(unlitCube);

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(texturedCube);
    webGl.mainCamera.node.components.behavior = arcball;

    webGl.start();
}

window.onresize = () => {
    webGl.canvasResized();
}