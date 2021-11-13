import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, parse, SubtagType } from '@cluster/utils';
import { CreateRoleOptions } from 'discord.js';

export class RoleCreateSubtag extends Subtag {
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
                    execute: (ctx, args) => this.createRole(ctx, args[0].value, '#000000', '0', 'false', 'false')
                },
                {
                    parameters: ['name', 'color:000000', 'permissions?:0'],
                    returns: 'id',
                    execute: (ctx, args) => this.createRole(ctx, args[0].value, args[1].value, args[2].value, 'false', 'false')
                },
                {
                    parameters: ['name', 'color:000000', 'permissions:0', 'mentionable:false', 'hoisted?:false'],
                    returns: 'id',
                    execute: (ctx, args) => this.createRole(ctx, args[0].value, args[1].value, args[2].value, args[3].value, args[4].value)
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
        const permission = context.permissions.valueOf();
        const topRole = discordUtil.getRoleEditPosition(context);

        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot create roles');

        const rolePerms = parse.bigInt(permStr);
        if (rolePerms === undefined)
            throw new BBTagRuntimeError('Permissions not a number');

        const options: CreateRoleOptions = {
            name,
            reason: discordUtil.formatAuditReason(context.user, context.scopes.local.reason),
            color: parse.color(colorStr),
            permissions: rolePerms,
            mentionable: parse.boolean(mentionableStr, false),
            hoist: parse.boolean(hoistedStr, false)
        };

        if ((rolePerms & permission) !== rolePerms)
            throw new BBTagRuntimeError('Author missing requested permissions');

        try {
            const role = await context.guild.roles.create(options);
            if (context.guild.roles.cache.get(role.id) === undefined)
                context.guild.roles.cache.set(role.id, role);
            return role.id;
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to create role: no perms');
        }
    }
}
