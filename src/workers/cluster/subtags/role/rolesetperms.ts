import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetPermsSubtag extends DefinedSubtag {
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
                    returns: 'nothing',
                    execute: (ctx, [role]) => this.roleSetPerms(ctx, role.value, '0', '')
                },
                {
                    parameters: ['role', 'permissions:0', 'quiet?'],
                    description: 'Sets the permissions of `role` with the provided `permissions` number. ' +
                        'This will not apply any permissions the authorizer can\'t grant. ' +
                        'Additionally, this will completely overwrite the role\'s existing permissions. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role now has the administrator permission. {rolesetperms;admin;8}',
                    exampleOut: 'The admin role now has the administrator permission.',
                    returns: 'nothing',
                    execute: (ctx, [role, permissions, quiet]) => this.roleSetPerms(ctx, role.value, permissions.value, quiet.value)
                }
            ]
        });
    }

    public async roleSetPerms(
        context: BBTagContext,
        roleStr: string,
        permsStr: string,
        quietStr: string
    ): Promise<void> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const quiet = typeof context.scopes.local.quiet === 'boolean' ? context.scopes.local.quiet : quietStr !== '';
        const role = await context.queryRole(roleStr, { noLookup: quiet, noErrors: context.scopes.local.noLookupErrors });
        const perms = parse.int(permsStr);

        const allowedPerms = context.permissions.allow;
        const mappedPerms = BigInt(perms) & allowedPerms;

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found');

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            await role.edit({ permissions: mappedPerms }, fullReason);
        } catch (err: unknown) {
            if (!quiet)
                throw new BBTagRuntimeError('Failed to edit role: no perms');
            throw new BBTagRuntimeError('Role not found');
        }
    }
}
