declare module 'require-reload' {
    export default function reload(context: NodeRequire): NodeRequire;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export default function reload(name: string, context: NodeRequire): any;
}
