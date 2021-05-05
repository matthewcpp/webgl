import {Behavior} from "./Behavior.js";
import {Node} from "../Node";
import {Scene} from "../Scene";

import {vec3, quat} from "gl-matrix";

export class Headlight extends Behavior {
    private _cameraNode: Node;
    private _lightNode: Node;

    public constructor(lightNode: Node, cameraNode: Node, scene: Scene) {
        super(scene);
        this._lightNode = lightNode;
        this._cameraNode = cameraNode;
    }

    public update(): void {
        vec3.copy(this._lightNode.position, this._cameraNode.position);
        quat.copy(this._lightNode.rotation, this._cameraNode.rotation);
    }
}