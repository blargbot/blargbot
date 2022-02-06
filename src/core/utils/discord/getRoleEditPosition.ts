import { Member } from 'eris';

import { getMemberPosition } from './getMemberPosition';
import { hasPermission } from './hasPermission';

export function getRoleEditPosition(member: Member | undefined): number {
    if (member === undefined)
        return -Infinity;

    if (member.guild.ownerID === member.id)
        return Infinity;

    if (!hasPermission(member, 'manageRoles'))
        return -Infinity;

    return getMemberPosition(member);
}
