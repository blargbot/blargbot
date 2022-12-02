import { parse } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, RoleNotFoundError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.roleSetPosition;

export class RoleSetPositionSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roleSetPosition',
            aliases: ['roleSetPos'],
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'position', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role, position, quiet]) => this.setRolePosition(ctx, role.value, position.value, quiet.value !== '')
                }
            ]
        });
    }

    public async setRolePosition(context: BBTagContext, roleStr: string, positionStr: string, quiet: boolean): Promise<boolean> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const pos = parse.int(positionStr);
        if (pos === undefined)
            throw new NotANumberError(positionStr);

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');
        if (pos >= topRole)
            throw new BBTagRuntimeError('Desired position above author');

        try {
            await role.editPosition(pos);
            return true;
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            if (quiet)
                return false;

            throw new BBTagRuntimeError('Failed to edit role: no perms', err.message);
        }
    }
}
