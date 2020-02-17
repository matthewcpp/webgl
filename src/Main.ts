import {WebGl} from "./WebGL.js";
import {ShaderInfo} from "./Shader.js";
import {MeshData} from "./Mesh.js";
import {Material} from "./Material.js";
import {Renderer} from "./Renderer.js";
import {Camera} from "./Camera.js";
import {Transform} from "./Transform.js";

import * as glMatrix from "../external/gl-matrix/common.js";
import * as vec3 from "../external/gl-matrix/vec3.js"
import * as vec4 from "../external/gl-matrix/vec4.js";

import "../external/jquery.min.js";


let webGl: WebGl = null;
let camera: Camera = null;

window.onload = async () => {
    glMatrix.setMatrixArrayType(Array);

    try {
        let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
        webGl = new WebGl(glCanvas);

        const shaderName = "basic";
        const shaderFiles = await Promise.all([
            jQuery.ajax(`/shaders/${shaderName}.vert.glsl`),
            jQuery.ajax(`/shaders/${shaderName}.frag.glsl`),
            jQuery.ajax(`/shaders/${shaderName}.json`)
        ]);

        const shader = webGl.createShader(shaderName, shaderFiles[0], shaderFiles[1], shaderFiles[2] as ShaderInfo);
        const material = new Material(shader);
        material.vec4.set("fragColor", vec4.fromValues(0.2, 0.845, 0.7, 1.0));

        const meshData = new MeshData();
        meshData.positions= [
            1.0,  1.0, 0.0,
            -1.0,  1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0, -1.0, 0.0
        ];

        meshData.triangles = [
            0,1,2,2,1,3
        ];

        const meshBuffer = webGl.createMeshBuffer("mesh", meshData);
        const transform = new Transform();
        vec3.set(transform.position, -5.0, 2.0, 0.0);
        transform.updateMatrix();

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
