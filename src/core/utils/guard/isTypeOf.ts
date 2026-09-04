export type TypeofMapping = {
    string: string;
    number: number;
    boolean: boolean;
    bigint: bigint;
    symbol: symbol;
    object: object;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    function: Function;
}

export function isTypeOf<Types extends [keyof TypeofMapping, ...Array<keyof TypeofMapping>]>(...types: Types): (value: unknown) => value is TypeofMapping[Types[number]] {
    const allowed = new Set(types);
    return (value: unknown): value is TypeofMapping[Types[number]] => allowed.has(typeof value);
}
