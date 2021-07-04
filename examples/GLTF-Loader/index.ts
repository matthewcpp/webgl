import {glMatrix} from "gl-matrix";
import {Arcball, Headlight, Loader, Scene} from "webgl"

let webGl: Scene = null;
let arcball: Arcball = null;
let headlight: Headlight = null;

const modelDomain = "https://webgl-models.s3-us-west-1.amazonaws.com/";

async function loadModel(modelPath: string) {
    const loader = new Loader(webGl);
    const isBinary = modelPath.endsWith(".glb");
    const modelUrl = modelDomain + modelPath;

    console.log(`Loading Model: ${modelUrl}`);

    if (isBinary)
        await loader.loadBinary(modelUrl);
    else
        await loader.load(modelUrl);

    arcball = new Arcball(webGl.mainCamera.node, webGl);
    headlight = new Headlight(webGl.lights.items[0].node, webGl.mainCamera.node);
    arcball.setInitial(webGl.calculateWorldBounding());
}

async function initScene() {
    glMatrix.setMatrixArrayType(Array);
    const glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    glCanvas.oncontextmenu = () => false;

    webGl = new Scene(glCanvas);
    await webGl.init();

    window.onresize = () => {
        webGl.canvasResized();
    }
}

function initUi() {
    const modelSelector = document.querySelector("#model-select") as HTMLSelectElement;
    modelSelector.onchange = async () => {
        webGl.clear();
        webGl.createDefault();

        await loadModel(modelSelector.value);
    }
}

function tick(timestamp: DOMHighResTimeStamp) {
    headlight.update();
    arcball.update(timestamp);
    webGl.draw();
    requestAnimationFrame(tick);
}

window.onload = async () => {
    await initScene();
    initUi();

    await loadModel("Cube/Cube.gltf");

    requestAnimationFrame(tick);
}