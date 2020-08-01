import {WebGl} from "../../src/WebGL.js";
import {Node} from "../../src/Node.js";
import * as GLTF from "../../src/GLTF/Loader.js";
import {Arcball} from "../../src/behaviors/Arcball.js";
import {Material} from "../../src/Material.js";
import {MeshInstance} from "../../src/Mesh.js";

import {KeyboardController} from "./KeyboardController.js"

import * as vec4 from "../../external/gl-matrix/vec4.js"
import * as vec3 from "../../external/gl-matrix/vec3.js"
import {PhongParams, PhongTexturedParams} from "../../src/shader/Phong.js";
import {downloadImage} from "../../src/Util.js";
import {LightType} from "../../src/Light.js";
import {UnlitParams} from "../../src/shader/Unlit.js";
import {FuncBehavior} from "../../src/behaviors/Behavior.js";
import * as glMatrix from "../../external/gl-matrix/common.js";
import {Bounds} from "../../src/Bounds.js";


let webGl: WebGl = null;


window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    glMatrix.setMatrixArrayType(Array);
    webGl = new WebGl(glCanvas);
    await webGl.init();

    webGl.canvas.oncontextmenu = () => false;

    const loader = new GLTF.Loader(webGl);
    // await loader.load("/models/Cube/Cube.gltf");
    await loader.load("/models/OrientationTest/OrientationTest.gltf");
    // await loader.load("/models/2CylinderEngine/2CylinderEngine.gltf");

    const directionalLight = new Node();
    directionalLight.components.light = webGl.createLight(LightType.Directional, directionalLight);
    directionalLight.position = [0.0, 3, 0.0];
    directionalLight.rotation = [50.0, -30.0, 0.0];
    directionalLight.updateMatrix();
    webGl.rootNode.addChild(directionalLight);


    const updatedWorldBounding = webGl.calculateWorldBounding();

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(updatedWorldBounding);
    webGl.mainCamera.node.components.behavior = arcball;

    webGl.start();
}

window.onresize = () => {
    webGl.canvasResized();
}