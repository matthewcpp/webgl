import {Scene} from "../Scene.js";

export abstract class Behavior {
    public active = true;

    protected constructor(
        protected readonly _scene: Scene
    ) {
        this._scene._behaviors.push(this);
    }

    abstract update(): void;
}

export class FuncBehavior extends Behavior{
    private readonly _func: () => void;

    public constructor(webgl: Scene, func: () => void) {
        super(webgl);
        this._func = func;
    }

    public update(): void {
        this._func();
    }
}