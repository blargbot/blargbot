export interface ChatLogMessage {
    readonly content: string;
    readonly attachment: string[];
    readonly userid: string;
    readonly msgid: string;
    readonly channelid: string;
    readonly guildid: string;
    readonly embeds: object[];
}
