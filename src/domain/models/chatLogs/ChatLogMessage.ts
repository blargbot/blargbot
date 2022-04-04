export interface ChatLogMessage {
    readonly content: string;
    readonly attachment: string | undefined;
    readonly userid: string;
    readonly msgid: string;
    readonly channelid: string;
    readonly guildid: string;
    readonly embeds: object[];
}
