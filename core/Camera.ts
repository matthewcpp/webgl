import {Node} from "./Node.js";

import {vec3, mat4} from "gl-matrix"

export class Camera {
    private _near = 0.1;
    private _far = 1000.0;
    private _aspect = 1.33;
    private _fovy = 45.0;

    public _matricesDirty = false;

    private _projectionMatrix: mat4 = mat4.create();
    private _viewMatrix: mat4 = mat4.create();

    public cullingMask = 0xFFFF;

    constructor(
        public readonly node: Node
    ) {}

    private _updateMatrices() {
        if (!this._matricesDirty) return;

        mat4.perspective(this._projectionMatrix,
            this._fovy * Math.PI / 180,
            this._aspect,
            this._near,
            this._far);

        const nodePos = this.node.position;
        let target = this.node.forward();
        vec3.add(target, nodePos, target);
        let up = this.node.up();

        mat4.lookAt(this._viewMatrix, nodePos, target, up);

        this._matricesDirty = false;
    }

    get near() { return this._near; }
    get far() { return this._far; }
    get aspect() { return this._aspect; }
    get fovy() { return this._fovy; }

    get projectionMatrix() {
        this._updateMatrices();

        return this._projectionMatrix;
    }

    get viewMatrix() {
        this._updateMatrices();

        return this._viewMatrix;
    }

    set near(value: number) {
        if (value != this._near) {
            this._near = value;
            this._matricesDirty = true;
        }
    }

    set far(value: number) {
        if (value != this._far) {
            this._far = value;
            this._matricesDirty = true;
        }
    }

    set aspect(value: number) {
        if (value != this._aspect) {
            this._aspect = value;
            this._matricesDirty = true;
        }
    }

    set fovy(value: number){
        if (value != this._fovy) {
            this._fovy = value;
            this._matricesDirty = true;
        }
    }
}