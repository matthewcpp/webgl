import * as vec3 from "../external/gl-matrix/vec3.js"
import * as mat3 from "../external/gl-matrix/mat3.js"
import * as mat4 from "../external/gl-matrix/mat4.js"

export class Bounds {
    public min = vec3.fromValues(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    public max = vec3.fromValues(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

    public static createFromMinMax(min: vec3, max: vec3) {
        const bounds = new Bounds();
        bounds.setMinMax(min, max)

        return bounds;
    }

    public setMinMax(min: vec3, max: vec3) {
        vec3.copy(this.min, min);
        vec3.copy(this.max, max);
    }

    public center() {
        let c = vec3.create();
        vec3.add(c, this.min, this.max);
        vec3.scale(c, c, 0.5);

        return c;
    }

    public invalidate() {
        vec3.set(this.min, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        vec3.set(this.max, Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
    }

    public encapsulateBounds(bounds: Bounds) {
        this.encapsulatePoint(bounds.min);
        this.encapsulatePoint(bounds.max);
    }

    public encapsulatePoint(point: vec3) {
        if (point[0] < this.min[0])
            this.min[0] = point[0];
        if (point[0] > this.max[0])
            this.max[0] = point[0];

        if (point[1] < this.min[1])
            this.min[1] = point[1];
        if (point[1] > this.max[1])
            this.max[1] = point[1];

        if (point[2] < this.min[2])
            this.min[2] = point[2];
        if (point[2] > this.max[2])
            this.max[2] = point[2];
    }

    // Based on code from: https://github.com/erich666/GraphicsGems/blob/master/gems/TransBox.c
    public static transform(out: Bounds, matrix: mat4, bounds: Bounds) {
        const transform = mat3.create();
        mat3.fromMat4(transform, matrix);
        const translate = vec3.fromValues(matrix[12], matrix[13], matrix[14]);

        /* Take care of translation by beginning at T. */
        out.setMinMax(translate, translate);

        /* Now find the extreme points by considering the product of the min and max with each component of M.  */
        for(let i = 0; i < 3; i++ ) {
            for (let j = 0; j < 3; j++) {
                const a = (transform[i * 3 + j] * bounds.min[j]);
                const b = (transform[i * 3 + j] * bounds.max[j]);
                if (a < b) {
                    out.min[i] += a;
                    out.max[i] += b;
                } else {
                    out.min[i] += b;
                    out.max[i] += a;
                }
            }
        }

        return out;
    }
}