export interface ChatlogUser {
    readonly id: string;
    readonly username?: string;
    readonly discriminator?: string;
    readonly avatarURL?: string;
}
