import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, hasFlag, parse, SubtagType } from '@cluster/utils';
import { RoleOptions } from 'eris';

export class RoleCreateSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'rolecreate',
            category: SubtagType.ROLE,
            desc: '`color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. ' +
                'Provide `permissions` as a number, which can be calculated [here](https://discordapi.com/permissions.html) ' +
                '`hoisted` is if the role should be displayed separately from other roles.\n' +
                'Returns the new role\'s ID.',
            definition: [
                {
                    parameters: ['name'],
                    description: 'Creates a role called `name`',
                    exampleCode: '{rolecreate;Super cool role!}',
                    exampleOut: '11111111111111111',
                    returns: 'id',
                    execute: (ctx, [name]) => this.createRole(ctx, name.value, '#000000', '0', 'false', 'false')
                },
                {
                    parameters: ['name', 'color:000000', 'permissions?:0'],
                    returns: 'id',
                    execute: (ctx, [name, color, permissions]) => this.createRole(ctx, name.value, color.value, permissions.value, 'false', 'false')
                },
                {
                    parameters: ['name', 'color:000000', 'permissions:0', 'mentionable:false', 'hoisted?:false'],
                    returns: 'id',
                    execute: (ctx, [name, color, permissions, mentionable, hoisted]) => this.createRole(ctx, name.value, color.value, permissions.value, mentionable.value, hoisted.value)
                }
            ]
        });
    }

    public async createRole(
        context: BBTagContext,
        name: string,
        colorStr: string,
        permStr: string,
        mentionableStr: string,
        hoistedStr: string
    ): Promise<string> {
        const permission = context.authorizer?.permissions.allow ?? 0n;
        const topRole = discordUtil.getRoleEditPosition(context.authorizer);

        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot create roles');

        const rolePerms = parse.bigInt(permStr);
        if (rolePerms === undefined)
            throw new BBTagRuntimeError('Permission not a number');

        const options: RoleOptions = {
            name,
            color: parse.color(colorStr),
            permissions: rolePerms,
            mentionable: parse.boolean(mentionableStr, false),
            hoist: parse.boolean(hoistedStr, false)
        };

        if (!hasFlag(permission, rolePerms))
            throw new BBTagRuntimeError('Author missing requested permissions');

        try {
            const role = await context.guild.createRole(options, discordUtil.formatAuditReason(context.user, context.scopes.local.reason));
            if (context.guild.roles.get(role.id) === undefined)
                context.guild.roles.set(role.id, role);
            return role.id;
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to create role: no perms');
        }
    }
}
