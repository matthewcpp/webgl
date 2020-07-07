import {WebGl} from "../WebGL.js";

export abstract class Behavior {
    public active: boolean;

    protected constructor(
        private _webgl: WebGl
    ) {
        this._webgl._behaviors.push(this);
    }

    get webgl() {
        return this._webgl;
    }

    abstract update(): void;


}