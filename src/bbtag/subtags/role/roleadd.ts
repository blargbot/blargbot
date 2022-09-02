import { Role } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

export class RoleAddSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roleadd',
            category: SubtagType.ROLE,
            aliases: ['addrole'],
            description: '`role` can be either a roleID or role mention.',
            definition: [
                {
                    parameters: ['role'],
                    description: 'Gives the executing user `role`. Returns `true` if role was given, else an error will be shown.',
                    exampleCode: 'Have a role! {roleadd;11111111111111111}',
                    exampleOut: 'Have a role! true',
                    returns: 'boolean',
                    execute: (ctx, [role]) => this.addRole(ctx, role.value, ctx.user.id, false)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: 'Gives `user` the chosen `role`. Returns `true` if role was given, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleCode: 'Stupid cat have a role! {roleadd;Bot;Stupid cat}',
                    exampleOut: 'Stupid cat have a role! true',
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
