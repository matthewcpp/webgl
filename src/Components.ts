import {Camera} from "./Camera.js";
import {Mesh} from "./Mesh.js";
import {Material} from "./Material.js";

export interface Components {
    camera?: Camera;
    mesh?: Mesh;
    material?: Material
}