import {glMatrix} from "gl-matrix";
import {Arcball, Headlight, GLTFLoader, Scene} from "webgl"

let webGl: Scene = null;
let arcball: Arcball = null;
let headlight: Headlight = null;

async function initScene() {
    glMatrix.setMatrixArrayType(Array);
    const glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    glCanvas.oncontextmenu = () => false;

    webGl = new Scene(glCanvas);
    await webGl.init();

    window.onresize = () => {
        webGl.canvasResized();
    }

    arcball = new Arcball(webGl.mainCamera.node, webGl);
    headlight = new Headlight(webGl.lights.items[0].node, webGl.mainCamera.node);
    arcball.setInitial(webGl.calculateWorldBounding());
}

const modelDomain = "https://webgl-models.s3-us-west-1.amazonaws.com/";

async function loadModel(modelPath: string) {
    const loader = new GLTFLoader(webGl);
    const isBinary = modelPath.endsWith(".glb");
    const modelUrl = modelDomain + modelPath;

    console.log(`Loading Model: ${modelUrl}`);

    if (isBinary)
        await loader.loadBinary(modelUrl);
    else
        await loader.load(modelUrl);

    arcball.setInitial(webGl.calculateWorldBounding());
}

function updateMaterials(shader){
    for (const mesh of webGl.meshes.items) {
        for (const primitive of mesh.primitives) {
            primitive.baseMaterial.shader = shader;
            webGl.shaders.updateProgram(primitive.baseMaterial, primitive);
        }
    }
}

function initUi() {
    const shadingModeSelector = document.querySelector("#shading-select") as HTMLSelectElement;
    shadingModeSelector.onchange = async () => {
        if (shadingModeSelector.value === "Phong")
            updateMaterials(webGl.shaders.defaultPhong);
        else
            updateMaterials(webGl.shaders.defaultUnlit);
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