import {Node} from "./Node";
import {Material} from "./Material";
import {Bounds} from "./Bounds";
import {Mesh} from "./Mesh";
import {Renderer} from "./Renderer";

export class MeshInstance {
    public readonly node: Node;
    public readonly mesh: Mesh
    public materials: Array<Material>;
    public worldBounds = new Bounds();

    public constructor(
        node: Node,
        mesh: Mesh,
        materials?: Array<Material>
    ) {
        this.node = node;
        this.mesh = mesh;
        this.materials = new Array<Material>(mesh.primitives.length);

        if (materials) {
            if (materials.length !== mesh.primitives.length)
                throw new Error("Unable to create mesh instance: primitive / material length mismatch.");

            for (let i = 0; i < materials.length; i++)
                this.materials[i] = materials[i].clone();
        }
        else {
            for (let i = 0; i < mesh.primitives.length; i++)
                this.materials[i] = mesh.primitives[i].baseMaterial.clone();
        }

        this.updateBounds();
    }

    public updateBounds() {
        Bounds.transform(this.worldBounds, this.node.worldMatrix, this.mesh.primitives[0].bounds);
    }
}

export class MeshInstances {
    constructor(private _renderer: Renderer) {}

    public create(node: Node, mesh: Mesh, materials?: Array<Material>) {
        const meshInstance = this._renderer.createMeshInstance(node, mesh, materials);
        node.components.meshInstance = meshInstance;
        return meshInstance;
    }
}