export interface ParseFloatOptions {
    readonly strict?: boolean;
}

export function parseFloat(s: string | number, options: ParseFloatOptions = {}): number | undefined {
    const result = floatCore(s, options);
    if (isNaN(result))
        return undefined;
    return result;

}

function floatCore(s: string | number, options: ParseFloatOptions): number {
    if (typeof s === `number`)
        return s;

    s = s.replace(/[,.](?=.*[,.])/g, ``).replace(`,`, `.`);
    if (options.strict === true && !floatTest.test(s))
        return NaN;

    return global.parseFloat(s);
}

const floatTest = /^[+-]?\d+(?:\.\d+)?$/;
