import {Behavior} from "../../src/behaviors/Behavior.js";
import {Node} from "../../src/Node.js";
import {WebGl} from "../../src/WebGL.js";

import * as vec3 from "../../external/gl-matrix/vec3.js"

export class KeyboardController extends Behavior {
    private _node: Node;
    private _direction = [0.0,0.0,0.0];
    private _speed = 1.0;
    private _state = 0;

    public constructor(node: Node, webgl: WebGl) {
        super(webgl);

        this._node = node;
        this.init();
    }

    public init() {
        document.addEventListener("keydown", (event:KeyboardEvent) => {
            switch (event.code) {
                case "ArrowUp":
                    this._state |= 1;
                    break;

                case "ArrowDown":
                    this._state |= 2;
                    break;

                case "ArrowLeft":
                    this._state |= 4;
                    break;

                case "ArrowRight":
                    this._state |= 8;
                    break;

                case "Minus":
                    this._state |= 16;
                    break;

                case "Equal":
                    this._state |= 32;
                    break;
            }
        });

        document.addEventListener("keyup", (event:KeyboardEvent) => {
            switch (event.code) {
                case "ArrowUp":
                    this._state &= ~1;
                    break;

                case "ArrowDown":
                    this._state &= ~2;
                    break;

                case "ArrowLeft":
                    this._state &= ~4;
                    break;

                case "ArrowRight":
                    this._state &= ~8;
                    break;

                case "Minus":
                    this._state &= ~16;
                    break;

                case "Equal":
                    this._state &= ~32;
                    break;
            }
        });
    }

    public update() {
        vec3.set(this._direction, 0.0, 0.0, 0.0);

        if (this._state & 1)
            this._direction[1] += 1.0;
        if (this._state & 2)
            this._direction[1] -= 1.0;
        if (this._state & 4)
            this._direction[0] -= 1.0;
        if (this._state & 8)
            this._direction[0] += 1.0;
        if (this._state & 16)
            this._direction[2] -= 1.0;
        if (this._state & 32)
            this._direction[2] += 1.0;

        vec3.normalize(this._direction, this._direction);
        vec3.scaleAndAdd(this._node.position, this._node.position, this._direction, this._speed * this._webgl.deltaTime);
        this._node.updateMatrix();
    }
}