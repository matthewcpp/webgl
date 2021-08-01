import {glMatrix} from "gl-matrix";
import {Arcball, Headlight, GLTFLoader, Scene} from "webgl"

let scene: Scene = null;
let arcball: Arcball = null;
let headlight: Headlight = null;

async function initScene() {
    glMatrix.setMatrixArrayType(Array);
    const glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    glCanvas.oncontextmenu = () => false;

    scene = new Scene(glCanvas);
    await scene.init();

    window.onresize = () => {
        scene.canvasResized();
    }

    const mainCamera = scene.cameras.items[0];
    arcball = new Arcball(mainCamera.node, scene);
    headlight = new Headlight(scene.lights.items[0].node, mainCamera.node);
    arcball.setInitial(scene.calculateWorldBounding());
}

const modelDomain = "https://webgl-models.s3-us-west-1.amazonaws.com/";

async function loadModel(modelPath: string) {
    const loader = new GLTFLoader(scene);
    const isBinary = modelPath.endsWith(".glb");
    const modelUrl = modelDomain + modelPath;

    console.log(`Loading Model: ${modelUrl}`);

    if (isBinary)
        await loader.loadBinary(modelUrl);
    else
        await loader.load(modelUrl);

    arcball.setInitial(scene.calculateWorldBounding());
}

function updateMaterials(shader){
    for (const mesh of scene.meshes.items) {
        for (const primitive of mesh.primitives) {
            primitive.baseMaterial.shader = shader;
            scene.shaders.updateProgram(primitive.baseMaterial, primitive);
        }
    }
}

function initUi() {
    const shadingModeSelector = document.querySelector("#shading-select") as HTMLSelectElement;
    shadingModeSelector.onchange = async () => {
        if (shadingModeSelector.value === "Phong")
            updateMaterials(scene.shaders.defaultPhong);
        else
            updateMaterials(scene.shaders.defaultUnlit);
    }
}

function tick(timestamp: DOMHighResTimeStamp) {
    headlight.update();
    arcball.update(timestamp);
    scene.renderer.draw();
    requestAnimationFrame(tick);
}

window.onload = async () => {
    await initScene();
    initUi();

    await loadModel("Cube/Cube.gltf");

    requestAnimationFrame(tick);
}