import * as vec3 from "../external/gl-matrix/vec3.js"
import * as mat3 from "../external/gl-matrix/mat3.js"
import * as mat4 from "../external/gl-matrix/mat4.js"

export class Bounds {
    public min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    public max = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

    public static createFromMinMax(min: vec3, max: vec3) {
        const bounds = new Bounds();

        vec3.copy(bounds.min, min);
        vec3.copy(bounds.max, max);

        return bounds;
    }

    public center() {
        let c = vec3.create();
        vec3.add(c, this.min, this.max);
        vec3.scale(c, c, 0.5);

        return c;
    }

    // Based on code from: https://github.com/erich666/GraphicsGems/blob/master/gems/TransBox.c
    public static transform(matrix: mat4, bounds: Bounds) {
        const transform = mat3.create();
        mat3.fromMat4(transform, matrix);
        const translate = vec3.fromValues(matrix[12], matrix[13], matrix[14]);

        /* Take care of translation by beginning at T. */
        const B = Bounds.createFromMinMax(translate, translate);

        /* Now find the extreme points by considering the product of the min and max with each component of M.  */
        for(let i = 0; i < 3; i++ ) {
            for (let j = 0; j < 3; j++) {
                const a = (transform[i * 3 + j] * bounds.min[j]);
                const b = (transform[i * 3 + j] * bounds.max[j]);
                if (a < b) {
                    B.min[i] += a;
                    B.max[i] += b;
                } else {
                    B.min[i] += b;
                    B.max[i] += a;
                }
            }
        }

        return B;
    }
}