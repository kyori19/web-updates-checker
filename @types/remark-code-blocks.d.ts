declare module 'remark-code-blocks' {
    import { Node } from "unist";

    interface CodeBlocks {
        [key:string]: string[],
    }

    export function codeblocks(tree: Node, options?): { codeblocks: CodeBlocks }
}
