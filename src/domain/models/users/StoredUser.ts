import { StoredUsername } from './StoredUsername';
import { StoredUserSettings } from './StoredUserSettings';
import { UserTodo } from './UserTodo';

export interface StoredUser extends StoredUserSettings {
    readonly userid: string;
    readonly username?: string;
    readonly usernames: readonly StoredUsername[];
    readonly discriminator?: string;
    readonly avatarURL?: string;
    readonly isbot: boolean;
    readonly lastspoke: Date;
    readonly lastcommand?: string;
    readonly lastcommanddate?: Date;
    readonly todo: readonly UserTodo[];
    readonly reportblock?: string;
    readonly reports?: { readonly [key: string]: string | undefined; };
}
