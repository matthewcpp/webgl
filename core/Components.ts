import {Camera} from "./Camera";
import {MeshInstance} from "./Mesh";
import {Light} from "./Light"

export interface Components {
    camera?: Camera;
    meshInstance?: MeshInstance;
    light?: Light;
}