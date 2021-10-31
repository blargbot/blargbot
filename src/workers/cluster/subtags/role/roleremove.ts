import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleRemoveSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roleremove',
            category: SubtagType.ROLE,
            aliases: ['removerole'],
            desc: '`role` can be either a roleID or role mention.',
            definition: [
                {
                    parameters: ['role'],
                    description: 'Removes `role` from the executing user. Returns `true` if role was removed, else an error will be shown.',
                    exampleCode: 'No more role! {roleremove;11111111111111111}',
                    exampleOut: 'No more role! true',
                    execute: (ctx, args, subtag) => this.removeRole(ctx, args[0].value, ctx.user.id, '', subtag)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: 'Remove the chosen `role` from  `user`. Returns `true` if role was removed, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleCode: 'Stupid cat no more role! {roleremove;Bot;Stupid cat}',
                    exampleOut: 'Stupid cat no more role! true',
                    execute: (ctx, args, subtag) => this.removeRole(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async removeRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            return this.customError('Author cannot remove roles', context, subtag);

        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
        const result = await discordUtil.checkRoles(context, roleStr, userStr, quiet);

        if (result.member === undefined) {
            if (quiet)
                return 'false';
            return this.noUserFound(context, subtag);
        }

        if (result.roles.length === 0)
            return this.noRoleFound(context, subtag);

        if (result.roles.find(role => role.position >= topRole) !== undefined)
            return this.customError('Role above author', context, subtag);

        const roles = result.roles.filter((_, i) => result.hasRole[i]).map(role => role.id);

        if (roles.length === 0)
            return 'false';

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
            const existingRoles = [...result.member.roles.cache.keys()];
            await result.member.edit({
                roles: existingRoles.filter(roleID => !roles.includes(roleID))
            }, fullReason);
            return 'true';
        } catch (err: unknown) {
            context.logger.error(err);
            return 'false';
        }
    }
}
