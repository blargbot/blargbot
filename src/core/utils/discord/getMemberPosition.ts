import type * as eris from 'eris';

export function getMemberPosition(member: eris.Member | undefined): number {
    return Math.max(...member?.roles.map(r => member.guild.roles.get(r)?.position ?? -Infinity) ?? [-Infinity]);
}
