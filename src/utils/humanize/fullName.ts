import { Member, User } from 'eris';

export function fullName(user: User | Member): string {
    return `${user.username}#${user.discriminator}`;
}