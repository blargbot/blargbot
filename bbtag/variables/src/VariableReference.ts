export interface VariableReference {
    readonly key: string;
    get value(): undefined | JToken;
}
