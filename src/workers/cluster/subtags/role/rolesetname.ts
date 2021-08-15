import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleSetNameSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesetname',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role'],
                    description: 'Remove the name of `role`',
                    exampleCode: '{rolesetname;admin}',
                    exampleOut: '', //TODO meaningful output
                    execute: (ctx, args, subtag) => this.setRolename(ctx, args[0].value, '', false, subtag)
                },
                {
                    parameters: ['role', 'name', 'quiet?'],
                    description: 'Sets the name of `role`.' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is now called administrator. {rolesetname;admin;administrator}',
                    exampleOut: 'The admin role is now called administrator.',
                    execute: (ctx, args, subtag) => this.setRolename(ctx, args[0].value, args[1].value, args[2].value !== '', subtag)
                }
            ]
        });
    }

    public async setRolename(
        context: BBTagContext,
        roleStr: string,
        name: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            return this.customError('Author cannot edit roles', context, subtag);

        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });

        if (role !== undefined) {
            if (role.position >= topRole)
                return this.customError('Role above author', context, subtag);

            try {
                const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
                await role.edit({ name }, fullReason);
                return ''; //TODO meaningful output
            } catch (err: unknown) {
                if (!quiet)
                    return this.customError('Failed to edit role: no perms', context, subtag);
            }
        }
        return this.noRoleFound(context, subtag);
    }
}
