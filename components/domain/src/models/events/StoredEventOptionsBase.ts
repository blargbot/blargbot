export interface StoredEventOptionsBase {
    readonly source: string;
    readonly channel?: string;
    readonly guild?: string;
    readonly endtime: number;
}
