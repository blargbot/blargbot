import { Role } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.roleremove;

export class RoleRemoveSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roleremove',
            category: SubtagType.ROLE,
            aliases: ['removerole'],
            description: '`role` can be either a roleID or role mention.',
            definition: [
                {
                    parameters: ['role'],
                    description: 'Removes `role` from the executing user. Returns `true` if role was removed, else an error will be shown.',
                    exampleCode: 'No more role! {roleremove;11111111111111111}',
                    exampleOut: 'No more role! true',
                    returns: 'boolean',
                    execute: (ctx, [role]) => this.removeRole(ctx, role.value, ctx.user.id, false)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: 'Remove the chosen `role` from  `user`. Returns `true` if role was removed, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleCode: 'Stupid cat no more role! {roleremove;Bot;Stupid cat}',
                    exampleOut: 'Stupid cat no more role! true',
                    returns: 'boolean',
                    execute: (ctx, [role, user, quiet]) => this.removeRole(ctx, role.value, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async removeRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot remove roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userStr, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? 'false' : undefined);
        }

        const roleStrs = bbtag.tagArray.deserialize(roleStr)?.v.map(v => v?.toString() ?? '~') ?? [roleStr];
        const roles = roleStrs.map(role => context.guild.roles.get(role)).filter((r): r is Role => r !== undefined);

        if (roles.length === 0)
            throw new RoleNotFoundError(roleStr);

        if (roles.find(role => role.position >= topRole) !== undefined)
            throw new BBTagRuntimeError('Role above author');

        if (roles.every(r => !member.roles.includes(r.id)))
            return false;

        try {
            const removeRoles = new Set(roles.map(r => r.id));
            const newRoleList = [...new Set(member.roles.filter(r => !removeRoles.has(r)))];
            await member.edit({ roles: newRoleList }, context.auditReason());
            member.roles = newRoleList;
            return true;
        } catch (err: unknown) {
            context.logger.error(err);
            return false;
        }
    }
}
