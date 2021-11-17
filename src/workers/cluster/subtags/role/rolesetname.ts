import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, RoleNotFoundError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleSetNameSubtag extends Subtag {
    public constructor() {
        super({
            name: 'rolesetname',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: 'Remove the name of `role`',
                    exampleCode: '{rolesetname;admin}',
                    exampleOut: '',
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role]) => this.setRolename(ctx, role.value, '', false)
                },
                {
                    parameters: ['role', 'name', 'quiet?'],
                    description: 'Sets the name of `role`.' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is now called administrator. {rolesetname;admin;administrator}',
                    exampleOut: 'The admin role is now called administrator.',
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role, name, quiet]) => this.setRolename(ctx, role.value, name.value, quiet.value !== '')
                }
            ]
        });
    }

    public async setRolename(
        context: BBTagContext,
        roleStr: string,
        name: string,
        quiet: boolean
    ): Promise<void> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            await role.edit({ name }, fullReason);
        } catch (err: unknown) {
            if (!quiet)
                throw new BBTagRuntimeError('Failed to edit role: no perms');
            throw new RoleNotFoundError(roleStr);
        }
    }
}
