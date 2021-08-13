import {MeshData} from "../MeshData";
import {Scene} from "../Scene";
import {vec3} from "gl-matrix";
import {PhongMaterial} from "../shader/Phong";

export class Cube {
    public static create(scene: Scene) {
        const meshData = new MeshData();

        meshData.positions = new Float32Array([
            -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, // Top
            -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // Bottom
            -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // Front
            -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, // Back
            1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, // Right
            -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, -1.0, // Left
        ]);

        meshData.normals = new Float32Array([
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // Top
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // Bottom
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // Front
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, // Back
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // Right
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // Left
        ]);

        meshData.texCoords0 = new Float32Array([
            0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, // Top
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, // Bottom
            0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, // Front
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // Back
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // Right
            0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, // Left
        ])

        vec3.set(meshData.bounds.min, -1.0, -1.0, -1.0);
        vec3.set(meshData.bounds.max, 1.0, 1.0, 1.0);

        const elementData = new Uint16Array([
            1,0,3,1,3,2, // Top
            5,4,7,5,7,6, // Bottom
            9,8,11,9,11,10, // Front
            13,12,15,13,15,14, // Back
            17,16,19,17,19,18, // Right
            21,20,23,21,23,22 // Left
        ]);

        const material = new PhongMaterial(scene.shaders.defaultPhong);

        meshData.addPrimitive(elementData, material);

        return meshData.create(scene);
    }
}