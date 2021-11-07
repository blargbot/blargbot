import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetMentionableSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesetmentionable',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: 'Set `role` to mentionable.',
                    exampleCode: 'The admin role is now mentionable. {rolesetmentionable;admin}',
                    exampleOut: 'The admin role is now mentionable.',
                    execute: (ctx, args, subtag) => this.setRolementionable(ctx, args[0].value, 'true', false, subtag)
                },
                {
                    parameters: ['role', 'value:true', 'quiet?'],
                    description: 'Sets whether `role` can be mentioned. `value` can be either `true` to set the role as mentionable, ' +
                        'or anything else to set it to unmentionable. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is no longer mentionable. {rolesetmentionable;admin;false}',
                    exampleOut: 'The admin role is no longer mentionable.', //TODO output like true/false
                    execute: (ctx, args, subtag) => this.setRolementionable(ctx, args[0].value, args[1].value, args[2].value !== '', subtag)
                }
            ]
        });
    }

    public async setRolementionable(
        context: BBTagContext,
        roleStr: string,
        toggleStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            return this.customError('Author cannot edit roles', context, subtag);

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const mentionable = parse.boolean(toggleStr, false);

        if (role !== undefined) {
            if (role.position >= topRole)
                return this.customError('Role above author', context, subtag);

            try {
                const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
                await role.edit({ mentionable }, fullReason);
                return ''; //TODO meaningful output
            } catch (err: unknown) {
                if (!quiet)
                    return this.customError('Failed to edit role: no perms', context, subtag);
            }
        }
        return this.customError('Role not found', context, subtag); //TODO this.noRoleFound instead
    }
}
