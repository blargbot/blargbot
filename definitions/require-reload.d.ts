declare module "require-reload" {
    export default function reload(context: NodeRequire): NodeRequire;
    export default function reload(name: string, context: NodeRequire): any;
}