export type SubtagSignatureParameterOptions = string | SubtagSignatureParameterGroupOptions;

export interface SubtagSignatureParameterGroupOptions {
    readonly minCount?: number;
    readonly repeat: readonly string[];
}
