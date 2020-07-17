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

    const crateTexture = webGl.createTextureFromImage("crateDiffuseMap", await downloadImage("/models/Cube/Cube_Crate.png"));
    const crateSpecularMap = webGl.createTextureFromImage("crateSpecularMap", await downloadImage("/models/Cube/Cube_Specular.png"));
    const crateEmissionMap = webGl.createTextureFromImage("crateEmissionMap", await downloadImage("/models/Cube/Cube_Emission.jpg"));
    const phongMaterial = new Material(await webGl.defaultShaders.phongTextured());
    const phongParams = phongMaterial.params as PhongTexturedParams;
    phongParams.diffuseTexture = crateTexture;
    phongParams.sepcularMap = crateSpecularMap;
    // phongParams.emissionMap = crateEmissionMap;

    //vec4.set(phongParams.diffuseColor, 1.0, 0.5, 0.31, 1.0);

    cubeObj.components.meshInstance.materials[0] = phongMaterial;

    const unlitCube = new Node();
    vec3.set(unlitCube.scale, 0.5 * 0.2, 0.5 * 0.2, 0.5 * 0.2);
    vec3.set(unlitCube.position, 0.0, 3.0, 0.0);
    vec3.set(unlitCube.rotation, 130.0, -30.0, 0.0);

    unlitCube.components.light = webGl.createLight(LightType.Directional, unlitCube);
    unlitCube.components.behavior = new KeyboardController(unlitCube, webGl);
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