import {WebGl} from "./WebGL.js";
import {MeshBufferData, MeshInfo} from "./Mesh.js";
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
        //vec3.set(transform.position, -5.0, 2.0, 0.0);
        //transform.updateMatrix();

        camera = new Camera();
        vec3.set(camera.transform.position, 0, 0, 10);
        vec3.set(camera.transform.rotation, 0, 180.0, 0.0);
        camera.transform.updateMatrix();
        camera.updateViewMatrix();

        camera.aspect = webGl.canvas.width / webGl.canvas.height;
        camera.updateProjectionMatrix();

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
