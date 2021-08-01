import {Scene} from "../Scene.js";
import {Node} from "../Node.js"
import {Bounds} from "../Bounds.js";

import {vec2, vec3, quat} from "gl-matrix";

export class Arcball {
    private _distance = 0.0;
    private _diagonal = 0.0;
    private _rotX = 0.0;
    private _rotY = 0.0;
    private _target = vec3.create();

    public rotationSpeed = 90.0;
    public cameraNode: Node;

    private _dragging = false;

    private _previousTime = performance.now();
    private _previousPos = vec2.create();
    private _currentPos = vec2.create();

    private _scene: Scene;

    public constructor(cameraNode: Node, scene: Scene){
        this.cameraNode = cameraNode;
        this._scene = scene;

        scene.canvas.onpointerdown = (event: PointerEvent) => { this._onPointerDown(event); }
        scene.canvas.onpointermove = (event:PointerEvent) => { this._onPointerMove(event); }
        scene.canvas.onpointerup = (event: PointerEvent) => { this._onPointerUp(event); }
        scene.canvas.onwheel = (event: WheelEvent) => { this._onWheel(event); }
    }

    public update(updateTime: number) {
        if (this._dragging && !vec2.equals(this._previousPos, this._currentPos)) {
            const deltaX = this._currentPos[0] - this._previousPos[0];
            const deltaY = this._currentPos[1] - this._previousPos[1];

            const deltaTime = (updateTime - this._previousTime) / 1000;
            this._orbit(deltaX, deltaY, deltaTime);
            vec2.copy(this._previousPos, this._currentPos);
        }

        this._previousTime = updateTime;
    }

    public setInitial(worldBounding: Bounds) {
        this._target = worldBounding.center();
        this._diagonal = vec3.distance(worldBounding.min, worldBounding.max);
        this._distance = this._diagonal * 2.0;

        vec3.copy(this.cameraNode.position, worldBounding.max);

        this._setCameraPos();
    }

    private _orbit(deltaX: number, deltaY:number, deltaTime: number) {
        const rotationAmount = this.rotationSpeed * deltaTime

        this._rotY -= deltaX * rotationAmount;
        this._rotX -= deltaY * rotationAmount;

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

        const orbitPos = vec3.fromValues(0.0, 0.0, 1.0);
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
        vec3.add(this.cameraNode.position, this._target, dir);
        this.cameraNode.lookAt(this._target, upVec);
        this.cameraNode.components.camera._matricesDirty = true;
    }

    private _setCurrentPos(event: PointerEvent) {
        const clientRect = this._scene.canvas.getBoundingClientRect();
        vec2.set(this._currentPos, event.clientX - clientRect.left, event.clientY - clientRect.top);
    }

    private _onPointerDown(event: PointerEvent) {
        this._dragging = true;
        this._setCurrentPos(event);
        vec2.copy(this._previousPos, this._currentPos);
    }

    private _onPointerMove(event: PointerEvent) {
        if (!this._dragging) return;
        this._setCurrentPos(event);
    }

    private _onPointerUp(_event: PointerEvent) {
        this._dragging = false;
    }

    private _onWheel(event: WheelEvent) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? 1 : -1;
        this._zoom(delta);
    }
}