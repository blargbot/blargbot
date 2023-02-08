export interface MessageFilter {
    readonly term: string;
    readonly regex: boolean;
    readonly decancer?: boolean;
}
