import { BBTagContext } from '@cluster/bbtag';

export function getRoleEditPosition(context: BBTagContext): number {
    if (context.guild.ownerID === context.authorizer || context.guild.id === context.authorizer)
        return Number.MAX_SAFE_INTEGER;
    const permission = context.permissions;
    if (!permission.has('manageRoles') && !permission.has('administrator'))
        return 0;
    const author = context.member;
    return Math.max(...author.roles.map(role => {
        return author.guild.roles.get(role)?.position ?? -Infinity;
    }));
}
