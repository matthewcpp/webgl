import {WebGl} from "../WebGL.js";

export abstract class Behavior {
    public active = true;

    protected constructor(
        protected readonly _webgl: WebGl
    ) {
        this._webgl._behaviors.push(this);
    }

    abstract update(): void;


}