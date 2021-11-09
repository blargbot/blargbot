import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleAddSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roleadd',
            category: SubtagType.ROLE,
            aliases: ['addrole'],
            desc: '`role` can be either a roleID or role mention.',
            definition: [
                {
                    parameters: ['role'],
                    description: 'Gives the executing user `role`. Returns `true` if role was given, else an error will be shown.',
                    exampleCode: 'Have a role! {roleadd;11111111111111111}',
                    exampleOut: 'Have a role! true',
                    execute: (ctx, args) => this.addRole(ctx, args[0].value, ctx.user.id, '')
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: 'Gives `user` the chosen `role`. Returns `true` if role was given, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleCode: 'Stupid cat have a role! {roleadd;Bot;Stupid cat}',
                    exampleOut: 'Stupid cat have a role! true',
                    execute: (ctx, args) => this.addRole(ctx, args[0].value, args[1].value, args[2].value)
                }
            ]
        });
    }

    public async addRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quietStr: string
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot add roles');

        const quiet = typeof context.scopes.local.quiet === 'boolean' ? context.scopes.local.quiet : quietStr !== '';
        const result = await discordUtil.checkRoles(context, roleStr, userStr, quiet);

        if (result.member === undefined) {
            if (quiet)
                return 'false';
            throw new UserNotFoundError(userStr);
        }

        if (result.roles.length === 0)
            throw new RoleNotFoundError(roleStr);

        if (result.roles.find(role => role.position >= topRole) !== undefined)
            throw new BBTagRuntimeError('Role above author');

        const roles = result.roles.filter((_, i) => !result.hasRole[i]);

        if (roles.length === 0)
            return 'false';

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            const existingRoles = [...result.member.roles.cache.keys()];
            await result.member.edit({
                roles: existingRoles.concat(...roles.map(r => r.id))
            }, fullReason);
            return 'true';
        } catch (err: unknown) {
            context.logger.error(err);
            return 'false';
        }
    }
}
