import { parse } from '@blargbot/core/utils';
import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.rolesetcolor;

export class RoleSetColorSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rolesetcolor',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.clear.description,
                    exampleCode: tag.clear.exampleCode,
                    exampleOut: tag.clear.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role]) => this.setRolecolor(ctx, role.value, '', false)
                },
                {
                    parameters: ['role', 'color', 'quiet?'],
                    description: tag.set.description,
                    exampleCode: tag.set.exampleCode,
                    exampleOut: tag.set.exampleOut,
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
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const color = parse.color(colorStr !== '' ? colorStr : 0);

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found'); //TODO RoleNotFoundError instead

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            await role.edit({ color }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError('Failed to edit role: no perms', err.message);
        }
    }
}
