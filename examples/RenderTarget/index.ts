import {glMatrix, quat} from "gl-matrix";
import {Arcball, Bounds, Camera, Cube, GLTFLoader, Headlight, LightType, RenderTarget, Scene, Node} from "webgl"
import {PhongMaterial} from "../../core/shader/Phong";

let scene: Scene = null;
let arcball: Arcball = null;
let headlight: Headlight = null;

let duckCamera: Camera = null;
let duckTarget: RenderTarget = null;
let duckNode: Node = null;
let duckRot = 0.0;
let lastUpdate: DOMHighResTimeStamp;
const DuckRotSpeed = 180.0;
let cubeCamera: Camera = null;

const modelDomain = "https://webgl-models.s3-us-west-1.amazonaws.com/";

async function initScene() {
    glMatrix.setMatrixArrayType(Array);
    const glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    glCanvas.oncontextmenu = () => false;

    scene = new Scene(glCanvas);
    await scene.init();

    window.onresize = () => { scene.canvasResized(); };

    const loader = new GLTFLoader(scene);
    loader.autoscaleScene = false;

    duckNode = scene.rootNode.createChild("Duck");
    loader.rootNode = duckNode;
    loader.meshInstanceLayerMask = 2;
    await loader.load(modelDomain + "Duck.glb");

    duckCamera = scene.cameras.items[0];
    duckCamera.cullingMask = 2;
    const duckBounds = new Bounds();
    scene.getNodeBounding(duckNode, duckBounds);

    const duckLight = scene.lights.items[0];
    duckLight.layerMask = 2;

    duckTarget = scene.renderTargets.create(256, 256);

    const cubeMesh = Cube.create(scene);
    const cubeMaterial = cubeMesh.primitives[0].baseMaterial as PhongMaterial;
    cubeMaterial.diffuseMap = duckTarget.colorTexture;
    scene.shaders.updateProgram(cubeMaterial, cubeMesh.primitives[0]);
    const cubeInstance = scene.meshInstances.create(scene.rootNode.createChild("Cube"), cubeMesh);
    cubeInstance.layerMask = 4;

    cubeCamera = scene.cameras.create(scene.rootNode.createChild("Cube Camera"));
    cubeCamera.cullingMask = 4;
    const cubeBounds = new Bounds();
    scene.getNodeBounding(cubeInstance.node, cubeBounds);

    const cubeLight = scene.lights.create(scene.rootNode.createChild("Cube Light"), LightType.Directional);
    cubeLight.layerMask = 4;

    arcball = new Arcball(duckCamera.node, scene);
    arcball.setInitial(duckBounds);

    headlight = new Headlight(duckLight, duckCamera);

    arcball.cameraNode = cubeCamera.node;
    arcball.setInitial(cubeBounds);

    headlight.reset(cubeLight, cubeCamera);
    lastUpdate = performance.now();
}


function tick(timestamp: DOMHighResTimeStamp) {
    headlight.update();
    arcball.update(timestamp);
    let elapsed = timestamp - lastUpdate;
    lastUpdate = timestamp;
    duckRot += DuckRotSpeed * (elapsed / 1000);
    quat.fromEuler(duckNode.rotation, 0.0, duckRot, 0.0);
    duckNode.updateMatrix();

    scene.gl.clearColor(1.0,0.0,0.0, 1.0);
    scene.renderer.camera = duckCamera;
    scene.renderer.renderTarget = duckTarget;
    scene.renderer.draw();

    scene.gl.clearColor(0.0,0.0,0.0, 1.0);
    scene.renderer.camera = cubeCamera;
    scene.renderer.renderTarget = null;
    scene.renderer.draw();

    requestAnimationFrame(tick);
}

window.onload = async () => {
    await initScene();

    requestAnimationFrame(tick);
}