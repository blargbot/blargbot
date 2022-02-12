import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, RoleNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { ApiError, DiscordRESTError } from 'eris';

export class RoleSetNameSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'rolesetname',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'name', 'quiet?'],
                    description: 'Sets the name of `role`.' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is now called administrator. {rolesetname;admin;administrator}',
                    exampleOut: 'The admin role is now called administrator.',
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role, name, quiet]) => this.setRolename(ctx, role.value, name.value, quiet.value !== '')
                }
            ]
        });
    }

    public async setRolename(
        context: BBTagContext,
        roleStr: string,
        name: string,
        quiet: boolean
    ): Promise<void> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });

        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            await role.edit({ name }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            if (quiet)
                return;

            throw new BBTagRuntimeError(`Failed to edit role: ${err.code === ApiError.MISSING_PERMISSIONS ? 'no perms' : err.message}`);
        }
    }
}
