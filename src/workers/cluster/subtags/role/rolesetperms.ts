import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetPermsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesetperms',
            category: SubtagType.ROLE,
            aliases: ['rolesetpermissions'],
            definition: [
                {
                    parameters: ['role'],
                    description: 'Removes all perms from `role`',
                    exampleCode: '{rolesetperms;Support}',
                    exampleOut: '(perms have been changed)', //TODO meaningful output
                    execute: (ctx, args, subtag) => this.roleSetPerms(ctx, args[0].value, '0', '', subtag)
                },
                {
                    parameters: ['role', 'permissions:0', 'quiet?'],
                    description: 'Sets the permissions of `role` with the provided `permissions` number. ' +
                        'This will not apply any permissions the authorizer can\'t grant. ' +
                        'Additionally, this will completely overwrite the role\'s existing permissions. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role now has the administrator permission. {rolesetperms;admin;8}',
                    exampleOut: 'The admin role now has the administrator permission.',
                    execute: (ctx, args, subtag) => this.roleSetPerms(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async roleSetPerms(
        context: BBTagContext,
        roleStr: string,
        permsStr: string,
        quietStr: string,
        subtag: SubtagCall
    ): Promise<string | void> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            return this.customError('Author cannot edit roles', context, subtag);

        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
        const role = await context.queryRole(roleStr, {noLookup: quiet, noErrors: context.scope.noLookupErrors });
        const perms = parse.int(permsStr);

        const allowedPerms = context.permissions.valueOf();
        const mappedPerms = BigInt(perms) & allowedPerms;

        if (role !== undefined) {
            if (role.position >= topRole)
                return this.customError('Role above author', context, subtag);

            try {
                const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
                await role.edit({ permissions: mappedPerms }, fullReason);
                return;
            } catch (err: unknown) {
                if (!quiet)
                    return this.customError('Failed to edit role: no perms', context, subtag);
            }
        }
        return this.customError('Role not found', context, subtag); //this.noRoleFound(context, subtag);
    }
}
