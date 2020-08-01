import {Behavior} from "./Behavior.js";
import {WebGl} from "../WebGL.js";
import {Node} from "../Node.js"
import {Bounds} from "../Bounds.js";

import * as vec3 from "../../external/gl-matrix/vec3.js"
import * as quat from "../../external/gl-matrix/quat.js"

export class Arcball extends Behavior {
    private _dragging = false;
    private _distance = 0.0;
    private _diagonal = 0.0;
    private _rotX = 0.0;
    private _rotY = 0.0;
    private _target = vec3.create();

    public rotationSpeed = 180.0;

    private _cameraNode: Node;

    public constructor(cameraNode: Node, webgl: WebGl){
        super(webgl);
        this._cameraNode = cameraNode;

        webgl.canvas.onpointerdown = (event: PointerEvent) => { this._onPointerDown(event); }
        webgl.canvas.onpointermove = (event:PointerEvent) => { this._onPointerMove(event); }
        webgl.canvas.onpointerup = (event: PointerEvent) => { this._onPointerUp(event); }
        webgl.canvas.onwheel = (event: WheelEvent) => { this._onWheel(event); }
    }

    update(): void {}

    public setInitial(worldBounding: Bounds) {
        this._target = worldBounding.center();
        this._diagonal = vec3.distance(worldBounding.min, worldBounding.max);
        this._distance = this._diagonal * 2.0;

        vec3.copy(this._cameraNode.position, worldBounding.max);

        this._setCameraPos();
    }

    private _orbit(deltaX: number, deltaY:number) {
        const rotationAmount = this.rotationSpeed * this._webgl.deltaTime

        this._rotY += deltaX * rotationAmount;
        this._rotX += deltaY * rotationAmount;

        this._setCameraPos();
    }

    private _zoom(delta: number) {
        this._distance += delta * this._diagonal * 0.1;
        this._setCameraPos();
    }

    private _setCameraPos() {
        this._rotX = Math.max(Math.min(this._rotX, 90.0), -90.0);

        const q = quat.create();
        quat.fromEuler(q, this._rotX, this._rotY, 0.0);

        const orbitPos = [0.0, 0.0, 1.0];
        vec3.transformQuat(orbitPos, orbitPos, q);
        vec3.normalize(orbitPos, orbitPos);

        const upVec = vec3.fromValues(0.0, 1.0, 0.0);
        vec3.transformQuat(upVec, upVec, q);
        vec3.normalize(upVec, upVec);

        const dir = vec3.create();
        vec3.add(orbitPos, orbitPos, this._target);
        vec3.subtract(dir, orbitPos, this._target);
        vec3.normalize(dir, dir);
        vec3.scale(dir, dir, this._distance);
        vec3.add(this._cameraNode.position, this._target, dir);
        this._cameraNode.lookAt(this._target, upVec);
        this._cameraNode.components.camera._matricesDirty = true;
    }

    private _onPointerDown(event: PointerEvent) {
        this._dragging = true;
    }

    private _onPointerMove(event: PointerEvent) {
        if (!this._dragging) return;

        let deltaX = 0.0;
        if (event.movementX > 0) deltaX = -1.0;
        else if (event.movementX < 0) deltaX = 1.0;

        let deltaY = 0.0;
        if (event.movementY > 0) deltaY = -1.0;
        else if (event.movementY < 0) deltaY = 1.0;

        this._orbit(deltaX, deltaY);
    }

    private _onPointerUp(event: PointerEvent) {
        this._dragging = false;
    }

    private _onWheel(event: WheelEvent) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? 1 : -1;
        this._zoom(delta);
    }
}