import {WebGl} from "./WebGL.js";
import {MeshBuffer, MeshBufferData, MeshInfo} from "./Mesh.js";
import {Renderer} from "./Renderer.js";
import {Camera} from "./Camera.js";
import {Transform} from "./Transform.js";

import * as glMatrix from "../external/gl-matrix/common.js";
import * as vec3 from "../external/gl-matrix/vec3.js"
import * as quat from "../external/gl-matrix/quat.js"

import {downalodMaterial, downloadModel} from "./Util.js";

let webGl: WebGl = null;
let camera: Camera = null;

const rotationSpeed = 90.0;

window.onload = async () => {
    glMatrix.setMatrixArrayType(Array);

    let rotationAngles = vec3.fromValues(-90.0, 0.0, 0.0);
    let lastUpdateTime: DOMHighResTimeStamp = 0;

    try {
        let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
        webGl = new WebGl(glCanvas);

        const material = await downalodMaterial("/assets/basic.material.json", webGl);
        const meshBuffer = webGl.createMeshBuffer("mesh", await downloadModel("/assets/chalet.model"));

        const transform = new Transform();
        quat.fromEuler(transform.rotation, rotationAngles[0], rotationAngles[1], rotationAngles[2]);
        transform.updateMatrix();

        camera = new Camera();
        setCameraPos(camera, meshBuffer);

        camera.aspect = webGl.canvas.width / webGl.canvas.height;
        camera.updateProjectionMatrix();

        webGl.renderFunc = (timestamp: DOMHighResTimeStamp, renderer: Renderer) => {
            if (lastUpdateTime == 0) lastUpdateTime = timestamp;
            const timeDelta = (timestamp - lastUpdateTime) / 1000.0;
            lastUpdateTime = timestamp;

            rotationAngles[1] += timeDelta * rotationSpeed;
            if (rotationAngles[1] >= 360.0)
                rotationAngles[1] -= 360.0;

            quat.fromEuler(transform.rotation, rotationAngles[0], rotationAngles[1], rotationAngles[2]);
            transform.updateMatrix();

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