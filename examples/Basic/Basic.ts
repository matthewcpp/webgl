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

    const cubeObj = roots[0];
    vec3.set(cubeObj.scale, 5, 0.1, 5);
    cubeObj.updateMatrix();

    const crateTexture = webGl.createTextureFromImage("crateDiffuseMap", await downloadImage("/models/Cube/Cube_Crate.png"));
    const crateSpecularMap = webGl.createTextureFromImage("crateSpecularMap", await downloadImage("/models/Cube/Cube_Specular.png"));
    const crateEmissionMap = webGl.createTextureFromImage("crateEmissionMap", await downloadImage("/models/Cube/Cube_Emission.jpg"));
    const phongMaterial = new Material(await webGl.defaultShaders.phongTextured());
    const phongParams = phongMaterial.params as PhongTexturedParams;
    phongParams.diffuseTexture = crateTexture;
    //phongParams.sepcularMap = crateSpecularMap;
    // phongParams.emissionMap = crateEmissionMap;

    //vec4.set(phongParams.diffuseColor, 1.0, 0.5, 0.31, 1.0);

    cubeObj.components.meshInstance.materials[0] = phongMaterial;

    /*
    const spotLight = new Node();
    vec3.set(spotLight.position, 0.0, 5.0, 0.0);
    vec3.set(spotLight.scale, 0.5 * 0.2, 0.5 * 0.2, 0.5 * 0.2);
    spotLight.rotation[0] = 90.0;
    //spotLight.rotation[1] = 20.0;
    //spotLight.lookAt([0.0,0.0,0.0], spotLight.up());
    spotLight.updateMatrix();

    spotLight.components.light = webGl.createLight(LightType.Spot, spotLight);
    spotLight.components.light.intensity = 5.0;
    spotLight.components.light.color = [1.0, 0.0, 0.0];

    spotLight.components.meshInstance = new MeshInstance(
        cubeObj.components.meshInstance.mesh,
        [new Material(await webGl.defaultShaders.unlit())]
    );

    webGl.rootNode.addChild(spotLight);
    */

    /*
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
    */

    const pointLight = new Node();
    vec3.set(pointLight.scale, 0.5 * 0.2, 0.5 * 0.2, 0.5 * 0.2);
    //vec3.set(pointLight.position, 1.8350799999999976, 1.3344970000000003, -1.5330249999999976);
    vec3.set(pointLight.position, 0.0, 1.0, 0.0);
    pointLight.rotation[0] = 90.0;
    pointLight.rotation[2] = 30.0;
    pointLight.updateMatrix();

    pointLight.components.behavior = new KeyboardController(pointLight, webGl);
    pointLight.components.light = webGl.createLight(LightType.Spot, pointLight);
    pointLight.components.light.intensity = 3.0;
    pointLight.components.light.range = 20.0;
    pointLight.components.light.spotInnerAngle = 12.5;
    pointLight.components.light.spotOuterAngle = 17.5;
    pointLight.components.light.color = [0.367, 0.125, 0.45];

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