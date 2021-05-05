import {glMatrix, quat} from "gl-matrix";
import {Arcball, Headlight, Loader, LightType, Node, Scene} from "webgl"

let webGl: Scene = null;

window.onload = async () => {
    glMatrix.setMatrixArrayType(Array);
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    glCanvas.oncontextmenu = () => false;

    webGl = new Scene(glCanvas);
    await webGl.init();

    window.onresize = () => {
        webGl.canvasResized();
    }

    const loader = new Loader(webGl);
    await loader.load("OrientationTest/OrientationTest.gltf");
    //await loader.load(modelUrl("Cube/Cube.gltf"));

    const directionalLight = new Node();
    directionalLight.components.light = webGl.createLight(LightType.Directional, directionalLight);
    directionalLight.position = [0.0, 3, 0.0];
    quat.fromEuler(directionalLight.rotation, 50.0, -30.0, 0.0);
    directionalLight.updateMatrix();
    webGl.rootNode.addChild(directionalLight);

    const updatedWorldBounding = webGl.calculateWorldBounding();

    const arcball = new Arcball(webGl.mainCamera.node, webGl);
    arcball.setInitial(updatedWorldBounding);
    webGl.mainCamera.node.components.behavior = arcball;
    webGl.mainCamera.near = 0.01;
    webGl.mainCamera.far = 1000

    directionalLight.components.behavior = new Headlight(directionalLight, webGl.mainCamera.node, webGl);

    webGl.start();
}