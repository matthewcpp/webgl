import {Node} from "./Node"

export function dfsWalk(node: Node, func: (node: Node) => void) {
    func(node);

    const childCount = node.getChildCount();
    for (let i = 0; i < childCount; i++)
        dfsWalk(node.getChild(i), func);
}