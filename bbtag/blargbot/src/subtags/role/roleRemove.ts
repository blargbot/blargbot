import type * as Eris from 'eris';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '@bbtag/engine';
import { bbtag, SubtagType } from '../../utils/index.js';

export class RoleRemoveSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roleRemove',
            category: SubtagType.ROLE,
            aliases: ['removeRole'],
            description: tag.description,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role]) => this.removeRole(ctx, role.value, ctx.user.id, false)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: tag.other.description,
                    exampleCode: tag.other.exampleCode,
                    exampleOut: tag.other.exampleOut,
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
        const roles = roleStrs.map(role => context.guild.roles.get(role)).filter((r): r is Eris.Role => r !== undefined);

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
