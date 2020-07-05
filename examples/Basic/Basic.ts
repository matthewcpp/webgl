import {WebGl} from "../../src/WebGL.js";
import {GLTFLoader} from "../../src/GLTF/Loader.js";
import {Material} from "../../src/Material.js";

console.log("hello world")

let webGl: WebGl = null;

window.onload = async () => {
    let glCanvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;
    webGl = new WebGl(glCanvas);

    const loader = new GLTFLoader(webGl);
    loader.defaultMaterial = new Material(await webGl.defaultShaders.unlit());
    await loader.load("triangle.gltf");

    webGl.start();
}