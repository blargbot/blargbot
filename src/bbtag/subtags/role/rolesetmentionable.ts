import { parse } from '@blargbot/core/utils';
import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.rolesetmentionable;

export class RoleSetMentionableSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rolesetmentionable',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.enable.description,
                    exampleCode: tag.enable.exampleCode,
                    exampleOut: tag.enable.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role]) => this.setRolementionable(ctx, role.value, 'true', false)
                },
                {
                    parameters: ['role', 'value:true', 'quiet?'],
                    description: tag.set.description,
                    exampleCode: tag.set.exampleCode,
                    exampleOut: tag.set.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role, value, quiet]) => this.setRolementionable(ctx, role.value, value.value, quiet.value !== '')
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
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const mentionable = parse.boolean(toggleStr, false);

        if (role === undefined)
            throw new BBTagRuntimeError('Role not found'); //TODO RoleNotFoundError instead

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            await role.edit({ mentionable }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError('Failed to edit role: no perms', err.message);
        }
    }
}
