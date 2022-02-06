import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetColorSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'rolesetcolor',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: 'Sets the color of `role` to \'#000000\'. This is transparent.',
                    exampleCode: 'The admin role is now colourless. {rolesetcolor;admin}',
                    exampleOut: 'The admin role is now colourless.',
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role]) => this.setRolecolor(ctx, role.value, '', false)
                },
                {
                    parameters: ['role', 'color', 'quiet?'],
                    description: 'Sets the `color` of `role`.' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is now white. {rolesetcolor;admin;white}',
                    exampleOut: 'The admin role is now white.',
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role, color, quiet]) => this.setRolecolor(ctx, role.value, color.value, quiet.value !== '')
                }
            ]
        });
    }

    public async setRolecolor(
        context: BBTagContext,
        roleStr: string,
        colorStr: string,
        quiet: boolean
    ): Promise<void> {
        const topRole = discordUtil.getRoleEditPosition(context.authorizer);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const color = parse.color(colorStr !== '' ? colorStr : 0);

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found'); //TODO RoleNotFoundError instead

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            await role.edit({ color }, fullReason);
        } catch (err: unknown) {
            if (!quiet)
                throw new BBTagRuntimeError('Failed to edit role: no perms');
        }
    }
}
