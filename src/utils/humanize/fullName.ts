import { Member, User } from 'eris';
import { StoredUser } from '../../core/database';

export function fullName(user: User | Member | StoredUser | DeepReadOnly<StoredUser> | undefined): string {
    if (user === undefined)
        return 'unknown#0000';
    return `${user.username}#${user.discriminator}`;
}