import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetColorSubtag extends BaseSubtag {
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
                    execute: (ctx, args, subtag) => this.setRolecolor(ctx, args[0].value, '', false, subtag)
                },
                {
                    parameters: ['role', 'color', 'quiet?'],
                    description: 'Sets the `color` of `role`.' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is now white. {rolesetcolor;admin;white}',
                    exampleOut: 'The admin role is now white.',
                    execute: (ctx, args, subtag) => this.setRolecolor(ctx, args[0].value, args[1].value, args[2].value !== '', subtag)
                }
            ]
        });
    }

    public async setRolecolor(
        context: BBTagContext,
        roleStr: string,
        colorStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            return this.customError('Author cannot edit roles', context, subtag);

        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const color = parse.color(colorStr !== '' ? colorStr : 0);

        if (role !== undefined) {
            if (role.position >= topRole)
                return this.customError('Role above author', context, subtag);

            try {
                const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
                await role.edit({ color }, fullReason);
                return ''; //TODO meaningful output
            } catch (err: unknown) {
                if (!quiet)
                    return this.customError('Failed to edit role: no perms', context, subtag);
            }
        }
        return this.customError('Role not found', context, subtag); //TODO this.noRoleFound instead
    }
}
