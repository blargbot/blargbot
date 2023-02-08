export default function getCallerImportMeta(): ImportMeta {
    const stack = getStack();
    stack.shift(); // getCallerImportMeta();

    const caller = stack.shift()?.getFileName() ?? undefined;
    if (caller === undefined)
        throw new Error('No caller file');

    return createImportMeta(caller);
}

function getStack(): NodeJS.CallSite[] {
    const oldPrepare = Error.prepareStackTrace;
    let result: NodeJS.CallSite[] = [];
    Error.prepareStackTrace = (...args) => {
        Error.prepareStackTrace = oldPrepare;
        result = [...args[1]];
        return Error.prepareStackTrace?.(...args) as unknown;
    };
    new Error().stack;
    result.shift(); // new Error();
    result.shift(); // getStack();
    return result;
}

function createImportMeta(url: string): ImportMeta {
    const result = Object.create(import.meta);
    result.url = url;
    return result;
}
