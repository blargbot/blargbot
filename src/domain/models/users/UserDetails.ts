export interface UserDetails {
    readonly id: string;
    readonly discriminator: string;
    readonly username: string;
    readonly bot: boolean;
    readonly avatarURL: string;
}
