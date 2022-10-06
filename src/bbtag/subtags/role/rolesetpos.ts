import { parse } from '@blargbot/core/utils';
import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotANumberError, RoleNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class RoleSetPosSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `rolesetpos`,
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: [`role`, `position`, `quiet?`],
                    description: `Sets the position of \`role\`. If \`quiet\` is specified, if \`role\` can't be found it will simply return nothing.`,
                    exampleCode: `The admin role is now at position 3. {rolesetpos;admin;3}`,
                    exampleOut: `The admin role is now at position 3.`,
                    returns: `boolean`,
                    execute: (ctx, [role, position, quiet]) => this.setRolePosition(ctx, role.value, position.value, quiet.value !== ``)
                }
            ]
        });
    }

    public async setRolePosition(context: BBTagContext, roleStr: string, positionStr: string, quiet: boolean): Promise<boolean> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError(`Author cannot edit roles`);

        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const pos = parse.int(positionStr);
        if (pos === undefined)
            throw new NotANumberError(positionStr);

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError(`Role above author`);
        if (pos >= topRole)
            throw new BBTagRuntimeError(`Desired position above author`);

        try {
            await role.editPosition(pos);
            return true;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            if (quiet)
                return false;

            throw new BBTagRuntimeError(`Failed to edit role: no perms`, err.message);
        }
    }
}
