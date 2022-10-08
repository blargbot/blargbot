export interface FlagDefinition<TString> {
    readonly flag: Alphanumeric;
    readonly word: string;
    readonly description: TString;
}
