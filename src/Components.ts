import {Camera} from "./Camera.js";
import {MeshInstance} from "./Mesh.js";
import {Behavior} from "./behaviors/Behavior.js";

export interface Components {
    camera?: Camera;
    meshInstance?: MeshInstance;
    behavior?: Behavior;
}