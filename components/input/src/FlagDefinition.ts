export interface FlagDefinition<TString> extends Flag {
    readonly description: TString;
}

export interface Flag {
    readonly flag: Alphanumeric;
    readonly word: string;
}
