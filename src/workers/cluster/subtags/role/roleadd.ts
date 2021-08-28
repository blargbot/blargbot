import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
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
                    execute: (ctx, args, subtag) => this.addRole(ctx, args[0].value, ctx.user.id, '', subtag)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: 'Gives `user` the chosen `role`. Returns `true` if role was given, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleCode: 'Stupid cat have a role! {roleadd;Bot;Stupid cat}',
                    exampleOut: 'Stupid cat have a role! true',
                    execute: (ctx, args, subtag) => this.addRole(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async addRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            return this.customError('Author cannot add roles', context, subtag);

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

        const roles = result.roles.filter((_, i) => !result.hasRole[i]);

        if (roles.length === 0)
            return 'false';

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
            for (const role of roles)
                await result.member.roles.add(role, fullReason);
            return 'true';
        } catch (err: unknown) {
            context.logger.error(err);
            return 'false';
        }
    }
}

// module.exports =
//     Builder.APITag('roleadd')
//         .withAlias('addrole')
//         .withArgs(a => [a.required('role'), a.optional('user'), a.optional('quiet')])
//         .withDesc('Gives `user` the chosen `role`, where `role` is a role ID or mention. ' +
//             'You can find a list of roles and their ids by doing `b!roles`. ' +
//             'Returns `true` if `role` was given, and `false` otherwise. ' +
//             'If `quiet` is specified, if a user can\'t be found it will simply return `false`'
//         ).withExample(
//             'Have a role! {roleadd;11111111111111111}',
//             'Have a role! true'
//         )
//         .whenArgs(0, Builder.errors.notEnoughArguments)
//         .whenArgs('1-3', async function (subtag, context, args) {
//             const topRole = Builder.util.getRoleEditPosition(context);
//             if (topRole == 0)
//                 return Builder.util.error(subtag, context, 'Author cannot add roles');

//             const quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[2];
//             const result = await userHasRole.checkRoles(context, args[0], args[1], quiet);

//             if (result.user == null) {
//                 if (quiet)
//                     return false;
//                 return Builder.errors.noUserFound(subtag, context);
//             }
//             if (result.roles.length == 0)
//                 return Builder.errors.noRoleFound(subtag, context);

//             if (result.roles.find(role => role.position >= topRole))
//                 return Builder.util.error(subtag, context, 'Role above author');

//             const roles = result.roles.filter((e, i) => !result.hasRole[i]);

//             if (roles.length == 0)
//                 return 'false';

//             try {
//                 const fullReason = bu.formatAuditReason(context.user, context.scope.reason);
//                 for (const role of roles)
//                     await result.user.addRole(role.id, fullReason);
//                 return 'true';
//             } catch (err) {
//                 console.error(err);
//                 return 'false';
//             }
//         })
//         .whenDefault(Builder.errors.tooManyArguments)
//         .build();
