export interface Dump {
    readonly id: `${bigint}`;
    readonly content?: string;
    readonly embeds?: object[];
    readonly channelid: `${bigint}`;
    readonly expiry: number;
}
