import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotANumberError, RoleNotFoundError } from '@cluster/bbtag/errors';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetPosSubtag extends Subtag {
    public constructor() {
        super({
            name: 'rolesetpos',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'position', 'quiet?'],
                    description: 'Sets the position of `role`. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role is now at position 3. {rolesetpos;admin;3}',
                    exampleOut: 'The admin role is now at position 3.',
                    returns: 'boolean',
                    execute: (ctx, [role, position, quiet]) => this.setRolePosition(ctx, role.value, position.value, quiet.value !== '')
                }
            ]
        });
    }

    public async setRolePosition(context: BBTagContext, roleStr: string, positionStr: string, quiet: boolean): Promise<boolean> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const pos = parse.int(positionStr, false);
        if (pos === undefined)
            throw new NotANumberError(positionStr);

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');
        if (pos >= topRole)
            throw new BBTagRuntimeError('Desired position above author');

        try {
            await role.edit({ position: pos });
            return true;
        } catch (err: unknown) {
            if (!quiet)
                throw new BBTagRuntimeError('Failed to edit role: no perms');
            throw new RoleNotFoundError(roleStr);
        }
    }
}
