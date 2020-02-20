import {WebGl} from "./WebGL.js";
import {MeshBuffer, MeshBufferData, MeshInfo} from "./Mesh.js";
import {Renderer} from "./Renderer.js";
import {Camera} from "./Camera.js";
import {Transform} from "./Transform.js";

import * as glMatrix from "../external/gl-matrix/common.js";
import * as vec3 from "../external/gl-matrix/vec3.js"

import {downalodMaterial, downloadModel} from "./Util.js";

let webGl: WebGl = null;
let camera: Camera = null;

window.onload = async () => {
    glMatrix.setMatrixArrayType(Array);

    try {
        let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
        webGl = new WebGl(glCanvas);

        const material = await downalodMaterial("/materials/basic.json", webGl);
        const meshBuffer = webGl.createMeshBuffer("mesh", await downloadModel("/models/basic.model"));

        const transform = new Transform();

        camera = new Camera();
        console.log(camera.transform.forward());
        setCameraPos(camera, meshBuffer);

        camera.aspect = webGl.canvas.width / webGl.canvas.height;
        camera.updateProjectionMatrix();

        console.log(camera.transform.forward());
        console.log(camera.transform.up());

        webGl.renderFunc = (renderer: Renderer) => {
            renderer.setCamera(camera);
            renderer.activateMaterial(material);
            renderer.drawMeshBuffer(meshBuffer, transform);
        };

        webGl.start();
    }
    catch (e) {
        alert(e);
    }
};

window.onresize = () => {
    webGl.resizeCanvas();

    camera.aspect = webGl.canvas.width / webGl.canvas.height;
    camera.updateProjectionMatrix();
};

function setCameraPos(camera: Camera, mesh: MeshBuffer) {
    let center = mesh.bounds.center();
    let cameraPos = mesh.bounds.center();
    let cameraDir = vec3.fromValues(0.0, 0.0, 1.0);
    vec3.scale(cameraDir, cameraDir, vec3.distance(mesh.bounds.min, mesh.bounds.max) * 1.5);

    vec3.add(cameraPos, cameraPos, cameraDir);
    vec3.copy(camera.transform.position, cameraPos);

    camera.transform.lookAt(center);

    camera.transform.updateMatrix();
    camera.updateViewMatrix();
}