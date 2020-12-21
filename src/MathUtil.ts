import {vec3, quat, mat4} from "gl-matrix"

export class MathUtil {
    public static extractTRS(matrix: mat4, translation: vec3, rotation: quat, scale: vec3) {
        mat4.getScaling(scale, matrix);

        // To extract a correct rotation, the scaling component must be eliminated.
        const mn = mat4.create();
        for(const col of [0, 1, 2])
        {
            mn[col] = matrix[col] / scale[0];
            mn[col + 4] = matrix[col + 4] / scale[1];
            mn[col + 8] = matrix[col + 8] / scale[2];
        }
        mat4.getRotation(rotation, mn);
        quat.normalize(rotation, rotation);

        mat4.getTranslation(translation, matrix);
    }
}