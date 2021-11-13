import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetMentionableSubtag extends Subtag {
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
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, args) => this.setRolementionable(ctx, args[0].value, 'true', false)
                },
                {
                    parameters: ['role', 'value:true', 'quiet?'],
                    description: 'Sets whether `role` can be mentioned. `value` can be either `true` to set the role as mentionable, ' +
                        'or anything else to set it to unmentionable. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is no longer mentionable. {rolesetmentionable;admin;false}',
                    exampleOut: 'The admin role is no longer mentionable.',
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, args) => this.setRolementionable(ctx, args[0].value, args[1].value, args[2].value !== '')
                }
            ]
        });
    }

    public async setRolementionable(
        context: BBTagContext,
        roleStr: string,
        toggleStr: string,
        quiet: boolean
    ): Promise<void> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const mentionable = parse.boolean(toggleStr, false);

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found'); //TODO RoleNotFoundError instead

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            await role.edit({ mentionable }, fullReason);
        } catch (err: unknown) {
            if (!quiet)
                throw new BBTagRuntimeError('Failed to edit role: no perms');
        }
    }
}
