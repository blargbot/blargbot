import { parse } from '@blargbot/core/utils/index.js';
import Eris from 'eris';

import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.roleSetMentionable;

export class RoleSetMentionableSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roleSetMentionable',
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
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError('Failed to edit role: no perms', err.message);
        }
    }
}
