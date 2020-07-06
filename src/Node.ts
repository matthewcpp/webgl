import {Transform} from "./Transform.js";
import {Components} from "./Components.js";

export class Node {
    public readonly transform = new Transform(this);
    public readonly components: Components = {}

    public constructor(
        public name: string = null
    ) {}
}