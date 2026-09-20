export type BBTagArray = { n?: string; v: JArray; };

export type SubtagSignatureValueParameter =
    | OptionalSubtagSignatureParameter
    | RequiredSubtagSignatureParameter

export type SubtagSignatureParameter =
    | SubtagSignatureValueParameter
    | SubtagSignatureParameterGroup

export interface OptionalSubtagSignatureParameter {
    readonly name: string;
    readonly required: false;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly maxLength: number;
}

export interface RequiredSubtagSignatureParameter {
    readonly name: string;
    readonly required: true;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly maxLength: number;
}

export interface SubtagSignatureParameterGroup {
    readonly minRepeats: number;
    readonly nested: readonly RequiredSubtagSignatureParameter[];
}

export interface SubtagSignature {
    readonly subtagName?: string;
    readonly parameters: readonly SubtagSignatureParameter[];
}

type SubtagReturnTypeValueMap = {
    hex: number;
    number: number | bigint;
    boolean: boolean;
    string: string;
    id: string;
    json: JToken;
    nothing: never;
}

type SubtagReturnTypeAtomicMap = SubtagReturnTypeValueMap & {
    [P in keyof SubtagReturnTypeValueMap as `${P}[]`]: AwaitableIterable<SubtagReturnTypeValueMap[P]>;
}

type SubtagReturnTypeUnion<T extends Array<keyof SubtagReturnTypeAtomicMap>, Other = never> = {
    [P in ArrayJoin<T, '|'>]: SubtagReturnTypeAtomicMap[T[number]] | Other;
}

type SubtagReturnTypeMapHelper = Omit<SubtagReturnTypeAtomicMap, 'nothing'>
    & SubtagReturnTypeUnion<['number', 'number[]']>
    & SubtagReturnTypeUnion<['boolean', 'number']>
    & SubtagReturnTypeUnion<['string', 'nothing']>
    & SubtagReturnTypeUnion<['json[]', 'nothing']>
    & SubtagReturnTypeUnion<['json', 'nothing']>
    & {
        unknown: AsyncIterable<string>;
        nothing: void;
        error: never;
        loop: AwaitableIterable<string>;
    }

export type SubtagReturnTypeMap = {
    [P in keyof SubtagReturnTypeMapHelper]: SubtagReturnTypeMapHelper[P]
}
