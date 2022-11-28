import { Member } from 'eris';

export function getMemberPosition(member: Member | undefined): number {
    return Math.max(...member?.roles.map(r => member.guild.roles.get(r)?.position ?? -Infinity) ?? [-Infinity]);
}
