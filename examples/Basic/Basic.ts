import {WebGl} from "../../src/WebGL.js";
import {Node} from "../../src/Node.js";
import * as GLTF from "../../src/GLTF/Loader.js";
import {Arcball} from "../../src/behaviors/Arcball.js";
import {Material} from "../../src/Material.js";
import {MeshInstance} from "../../src/Mesh.js";

import * as vec4 from "../../external/gl-matrix/vec4.js"
import * as vec3 from "../../external/gl-matrix/vec3.js"
import {PhongParams} from "../../src/shader/Phong.js";


let webGl: WebGl = null;

window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;

    webGl = new WebGl(glCanvas);
    await webGl.init();

    webGl.canvas.oncontextmenu = () => false;

    const loader = new GLTF.Loader(webGl);
    const roots = await loader.load("/models/Cube/Cube.gltf");

    const cubeObj = roots[0];
    vec3.set(cubeObj.scale, 0.5, 0.5, 0.5);
    cubeObj.updateMatrix();

    const phongMaterial = new Material(await webGl.defaultShaders.phong());
    const phongParams = phongMaterial.params as PhongParams;
    vec4.set(phongParams.diffuseColor, 1.0, 0.5, 0.31, 1.0);

    cubeObj.components.meshInstance.materials[0] = phongMaterial;

    const unlitCube = new Node();
    vec3.set(unlitCube.scale, 0.5 * 0.2, 0.5 * 0.2, 0.5 * 0.2);
    vec3.set(unlitCube.position, 1.2, 1.0, 2.0);

    unlitCube.components.meshInstance = new MeshInstance(
        cubeObj.components.meshInstance.mesh,
        [new Material(await webGl.defaultShaders.unlit())]
    );

    webGl.rootNode.addChild(unlitCube);

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(cubeObj);
    webGl.mainCamera.node.components.behavior = arcball;

    webGl.start();
}

window.onresize = () => {
    webGl.canvasResized();
}