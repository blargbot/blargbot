import { Role } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.roleadd;

export class RoleAddSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roleadd',
            category: SubtagType.ROLE,
            aliases: ['addrole'],
            description: tag.description,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role]) => this.addRole(ctx, role.value, ctx.user.id, false)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: tag.other.description,
                    exampleCode: tag.other.exampleCode,
                    exampleOut: tag.other.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role, user, quiet]) => this.addRole(ctx, role.value, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async addRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot add roles');

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

        if (roles.every(r => member.roles.includes(r.id)))
            return false;

        try {
            const newRoleList = [...new Set([...member.roles, ...roles.map(r => r.id)])];
            await member.edit({ roles: newRoleList }, context.auditReason());
            member.roles = newRoleList;
            return true;
        } catch (err: unknown) {
            context.logger.error(err);
            return false;
        }
    }
}
