import { Member } from 'eris';

export function getMemberPosition(member: Member): number {
    return Math.max(...member.roles.map(r => member.guild.roles.get(r)?.position ?? -Infinity));
}
