export type DiscordUserTag = KnownDiscordUserTag | UnknownDiscordUserTag;

export interface KnownDiscordUserTag {
    readonly id: string;
    readonly username: string;
    readonly discriminator: string;
    readonly avatarURL?: string;
}

export interface UnknownDiscordUserTag {
    readonly id: string;
    readonly username?: undefined;
    readonly discriminator?: undefined;
    readonly avatarURL?: undefined;
}
