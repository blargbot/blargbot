import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { ApiError, DiscordRESTError } from 'eris';

export class RoleSetMentionableSubtag extends DefinedSubtag {
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
                    execute: (ctx, [role]) => this.setRolementionable(ctx, role.value, 'true', false)
                },
                {
                    parameters: ['role', 'value:true', 'quiet?'],
                    description: 'Sets whether `role` can be mentioned. `value` can be either `true` to set the role as mentionable, ' +
                        'or anything else to set it to unmentionable. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is no longer mentionable. {rolesetmentionable;admin;false}',
                    exampleOut: 'The admin role is no longer mentionable.',
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

            throw new BBTagRuntimeError(`Failed to edit role: ${err.code === ApiError.MISSING_PERMISSIONS ? 'no perms' : err.message}`);
        }
    }
}
