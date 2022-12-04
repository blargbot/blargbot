import type * as Eris from 'eris';

export function getMemberPosition(member: Eris.Member | undefined): number {
    return Math.max(...member?.roles.map(r => member.guild.roles.get(r)?.position ?? -Infinity) ?? [-Infinity]);
}
