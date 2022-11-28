import { ResettableStoredUserData } from './ResettableStoredUserData';
import { StoredUsername } from './StoredUsername';

export interface StoredUser extends ResettableStoredUserData {
    readonly userid: string;
    readonly reportblock?: string;
    readonly blacklisted?: string;
    readonly reports?: { readonly [key: string]: string | undefined; };
    readonly username?: string;
    readonly usernames: readonly StoredUsername[];
    readonly discriminator?: string;
    readonly avatarURL?: string;
}
