import { BBTagContext } from '@cluster/bbtag';

export function getRoleEditPosition(context: BBTagContext): number {
    if (context.guild.ownerId === context.authorizer || context.guild.id === context.authorizer)
        return Number.MAX_SAFE_INTEGER;
    const permission = context.permissions;
    if (!permission.has('MANAGE_ROLES') && !permission.has('ADMINISTRATOR'))
        return 0;
    const author = context.member;
    return Math.max(...author.roles.cache.map(role => {
        return role.position;
    }));
}
