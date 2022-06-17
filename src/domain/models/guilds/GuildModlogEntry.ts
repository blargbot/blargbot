export interface GuildModlogEntry {
    readonly caseid: number;
    readonly modid?: string;
    readonly msgid?: string;
    readonly channelid?: string;
    readonly reason?: string;
    readonly type: string;
    readonly userid: string;
}
