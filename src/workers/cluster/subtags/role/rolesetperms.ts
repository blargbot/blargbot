import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, parse, SubtagType } from '@cluster/utils';
import { ApiError, DiscordRESTError } from 'eris';

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
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const quiet = typeof context.scopes.local.quiet === 'boolean' ? context.scopes.local.quiet : quietStr !== '';
        const role = await context.queryRole(roleStr, { noLookup: quiet, noErrors: context.scopes.local.noLookupErrors });
        const perms = parse.bigInt(permsStr) ?? 0n;

        const mappedPerms = perms & context.permission.allow;

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found');

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            await role.edit({ permissions: mappedPerms }, fullReason);
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError(`Failed to edit role: ${err.code === ApiError.MISSING_PERMISSIONS ? 'no perms' : err.message}`);
        }
    }
}
