import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { bbtagUtil, discordUtil, parse, SubtagType } from '@cluster/utils';
import { Role } from 'discord.js';

export class UserSetRolesSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usersetroles',
            aliases: ['setroles'],
            category: SubtagType.ROLE,
            desc: '`roleArray` must be an array formatted like `["role1", "role2"]`',
            definition: [
                {
                    parameters: ['roleArray?'],
                    description: 'Sets the roles of the current user to `roleArray`.',
                    exampleCode: '{usersetroles;["1111111111111"]}',
                    exampleOut: 'true',
                    execute: (ctx, args, subtag) => this.userSetRole(ctx, args[0].value, ctx.user.id, false, subtag)
                },
                {
                    parameters: ['roleArray', 'user', 'quiet?'],
                    description: 'Sets the roles of `user` to `roleArray`. If quiet is provided, all errors will return `false`.',
                    exampleCode: '{usersetroles;["1111111111111"];stupid cat}',
                    exampleOut: 'true',
                    execute: (ctx, args, subtag) => this.userSetRole(ctx, args[0].value, args[1].value, args[2].value !== '', subtag)
                }
            ]
        });
    }

    public async userSetRole(
        context: BBTagContext,
        rolesStr: string,
        userStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            return this.customError('Author cannot remove roles', context, subtag);

        /*
         * Quiet suppresses all errors here instead of just the user errors
         * I feel like that is how it *should* work
        */
        quiet ||= context.scope.quiet ?? false;
        context.logger.log(quiet);
        const user = await context.queryUser(userStr, {
            noLookup: quiet,
            noErrors: context.scope.noLookupErrors
        });
        if (user === undefined)
            return quiet ? 'false' : this.noUserFound(context, subtag);

        const member = await context.util.getMember(context.guild.id, user.id);
        if (member === undefined)
            return quiet ? 'false' : this.noUserFound(context, subtag);

        const roleArr = await bbtagUtil.tagArray.getArray(context, rolesStr !== '' ? rolesStr : '[]');
        if (roleArr === undefined)
            return quiet ? 'false' : this.notAnArray(context, subtag);

        const parsedRoles: Role[] = [];

        for (const roleElement of roleArr.v) {
            const role = await context.queryRole(parse.string(roleElement), {
                noLookup: quiet,
                noErrors: context.scope.noLookupErrors
            });
            if (role === undefined)
                return quiet ? 'false' : this.noRoleFound(context, subtag, parse.string(roleElement) + ' is not a role');
            parsedRoles.push(role);
        }

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
            await member.edit({
                roles: parsedRoles
            }, fullReason);
            return 'true';
        } catch (err: unknown) {
            context.logger.error(err);
            return 'false';
        }

    }
}
