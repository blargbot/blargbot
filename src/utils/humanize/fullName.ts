import { Member, User } from 'eris';
import { StoredUser } from '../../core/database';

export function fullName(user: User | Member | StoredUser | undefined | null): string {
    if (user === undefined || user === null)
        return 'unknown#0000';
    return `${user.username}#${user.discriminator}`;
}