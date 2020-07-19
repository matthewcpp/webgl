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

export class FuncBehavior extends Behavior{
    private readonly _func: () => void;

    public constructor(webgl: WebGl, func: () => void) {
        super(webgl);
        this._func = func;
    }

    public update(): void {
        this._func();
    }
}