import {Camera} from "./Camera";
import {MeshInstance} from "./Mesh";
import {Behavior} from "./behaviors/Behavior";
import {Light} from "./Light"

export interface Components {
    camera?: Camera;
    meshInstance?: MeshInstance;
    behavior?: Behavior;
    light?: Light;
}