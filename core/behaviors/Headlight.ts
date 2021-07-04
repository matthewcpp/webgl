import {Node} from "../Node";

import {vec3, quat} from "gl-matrix";

export class Headlight{

    public constructor(
        private _lightNode: Node,
        private _cameraNode: Node) {
    }

    public update(): void {
        vec3.copy(this._lightNode.position, this._cameraNode.position);
        quat.copy(this._lightNode.rotation, this._cameraNode.rotation);
    }
}