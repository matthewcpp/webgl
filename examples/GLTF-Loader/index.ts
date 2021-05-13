import {glMatrix, quat, vec3} from "gl-matrix";
import {Arcball, Headlight, Loader, LightType, Node, Scene} from "webgl"

let webGl: Scene = null;

async function initScene() {
    glMatrix.setMatrixArrayType(Array);
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    glCanvas.oncontextmenu = () => false;

    webGl = new Scene(glCanvas);
    await webGl.init();

    window.onresize = () => {
        webGl.canvasResized();
    }

    const directionalLight = new Node();
    directionalLight.components.light = webGl.createLight(LightType.Directional, directionalLight);
    directionalLight.position = vec3.fromValues(0.0, 3, 0.0);
    quat.fromEuler(directionalLight.rotation, 50.0, -30.0, 0.0);
    directionalLight.updateMatrix();
    webGl.rootNode.addChild(directionalLight);

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(webGl.worldBounding);
    webGl.mainCamera.node.components.behavior = arcball;
    webGl.mainCamera.near = 0.01;
    webGl.mainCamera.far = 1000

    directionalLight.components.behavior = new Headlight(directionalLight, webGl.mainCamera.node, webGl);

    webGl.start();
}

window.onload = async () => {
    await initScene();

    const loader = new Loader(webGl);
    await loader.load("https://webgl-models.s3-us-west-1.amazonaws.com/Cube/Cube.gltf");

    const arcball = webGl.mainCamera.node.components.behavior as Arcball;
    arcball.setInitial(webGl.calculateWorldBounding());
}