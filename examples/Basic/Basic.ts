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
    //phongParams.diffuseTexture = crateTexture;
    phongParams.sepcularMap = crateSpecularMap;
    // phongParams.emissionMap = crateEmissionMap;

    //vec4.set(phongParams.diffuseColor, 1.0, 0.5, 0.31, 1.0);

    cubeObj.components.meshInstance.materials[0] = phongMaterial;

    const directionalLight = new Node();
    vec3.set(directionalLight.scale, 0.5 * 0.2, 0.5 * 0.2, 0.5 * 0.2);
    vec3.set(directionalLight.position, 0.0, 3.0, 0.0);
    vec3.set(directionalLight.rotation, 130.0, -30.0, 0.0);
    directionalLight.updateMatrix();

    directionalLight.components.light = webGl.createLight(LightType.Directional, directionalLight);

    directionalLight.components.meshInstance = new MeshInstance(
        cubeObj.components.meshInstance.mesh,
        [new Material(await webGl.defaultShaders.unlit())]
    );

    webGl.rootNode.addChild(directionalLight);

    const pointLight = new Node();
    vec3.set(pointLight.scale, 0.5 * 0.2, 0.5 * 0.2, 0.5 * 0.2);
    vec3.set(pointLight.position, 1.8350799999999976, 1.3344970000000003, -1.5330249999999976);
    pointLight.updateMatrix();

    pointLight.components.behavior = new KeyboardController(pointLight, webGl);
    pointLight.components.light = webGl.createLight(LightType.Point, pointLight);
    vec3.set(pointLight.components.light.color, 0.0, 1.0, 0.0);
    pointLight.components.light.intensity = 3.0;

    pointLight.components.meshInstance = new MeshInstance(
        cubeObj.components.meshInstance.mesh,
        [new Material(await webGl.defaultShaders.unlit())]
    );

    webGl.rootNode.addChild(pointLight);

    const pointLightMaterial = pointLight.components.meshInstance.materials[0].params as UnlitParams;
    vec3.set(pointLightMaterial.color, 0.0, 1.0, 0.0);

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(cubeObj);
    webGl.mainCamera.node.components.behavior = arcball;

    webGl.start();
}

window.onresize = () => {
    webGl.canvasResized();
}