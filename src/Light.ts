import {Node} from "./Node.js";

import * as vec3 from "../external/gl-matrix/vec3.js";

export class Light {
    public color = vec3.fromValues(1.0, 1.0, 1.0);

    public constructor(
        public readonly node: Node
    ) {}
}