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


let webGl: WebGl = null;


window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;

    webGl = new WebGl(glCanvas);
    await webGl.init();

    webGl.canvas.oncontextmenu = () => false;

    const loader = new GLTF.Loader(webGl);
    const roots = await loader.load("/models/Cube/Cube.gltf");
    //const roots = await loader.load("/models/OrientationTest/OrientationTest.gltf");

    const directionalLight = new Node();
    directionalLight.components.light = webGl.createLight(LightType.Directional, directionalLight);
    directionalLight.position = [0.0, 3, 0.0];
    directionalLight.rotation = [50.0, -30.0, 0.0];
    directionalLight.updateMatrix();
    webGl.rootNode.addChild(directionalLight);


    const parentNode = new Node();
    parentNode.rotation = [0.0, 10.0, 10.0];
    parentNode.updateMatrix();

    const childNode = new Node();
    childNode.rotation = [30.0, 10.0, 0.0];
    childNode.updateMatrix();

    childNode.addChild(roots[0]);

    parentNode.addChild(childNode);
    webGl.rootNode.addChild(parentNode);

    console.log(childNode.worldMatrix);
    console.log(childNode.forward());

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(roots[0]);
    webGl.mainCamera.node.components.behavior = arcball;

    webGl.start();
}

window.onresize = () => {
    webGl.canvasResized();
}