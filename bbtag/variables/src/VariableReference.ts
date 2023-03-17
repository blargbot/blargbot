export interface IVariableReference {
    readonly key: string;
    get value(): undefined | JToken;
}
