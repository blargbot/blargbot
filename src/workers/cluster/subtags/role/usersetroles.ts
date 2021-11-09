import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError, UserNotFoundError } from '@cluster/bbtag/errors';
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
                    execute: (ctx, args) => this.userSetRole(ctx, args[0].value, ctx.user.id, false)
                },
                {
                    parameters: ['roleArray', 'user', 'quiet?'],
                    description: 'Sets the roles of `user` to `roleArray`. If quiet is provided, all errors will return `false`.',
                    exampleCode: '{usersetroles;["1111111111111"];stupid cat}',
                    exampleOut: 'true',
                    execute: (ctx, args) => this.userSetRole(ctx, args[0].value, args[1].value, args[2].value !== '')
                }
            ]
        });
    }

    public async userSetRole(
        context: BBTagContext,
        rolesStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot remove roles');

        /*
         * Quiet suppresses all errors here instead of just the user errors
         * I feel like that is how it *should* work
        */
        quiet ||= context.scopes.local.quiet ?? false;
        context.logger.log(quiet);
        const member = await context.queryMember(userStr, {
            noLookup: quiet,
            noErrors: context.scopes.local.noLookupErrors
        });
        if (member === undefined) {
            if (quiet)
                return 'false';
            throw new UserNotFoundError(userStr);
        }

        const roleArr = await bbtagUtil.tagArray.getArray(context, rolesStr !== '' ? rolesStr : '[]');
        if (roleArr === undefined) {
            if (quiet)
                return 'false';
            throw new NotAnArrayError(rolesStr);
        }

        const parsedRoles: Role[] = [];

        for (const roleElement of roleArr.v) {
            const role = await context.queryRole(parse.string(roleElement), {
                noLookup: quiet,
                noErrors: context.scopes.local.noLookupErrors
            });
            if (role === undefined) {
                if (quiet)
                    return 'false';
                throw new RoleNotFoundError(userStr);
            }
            parsedRoles.push(role);
        }

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
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
