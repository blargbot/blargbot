import { Member, User } from "eris";

export function fullName(user: User | Member) {
    return `${user.username}#${user.discriminator}`;
}