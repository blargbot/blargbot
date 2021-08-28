import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, parse, SubtagType } from '@cluster/utils';
import { CreateRoleOptions, Permissions } from 'discord.js';

export class RoleCreateSubtag extends BaseSubtag {
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
                    execute: (ctx, args, subtag) => this.createRole(ctx, args[0].value, '#000000', '0', 'false', 'false', subtag)
                },
                {
                    parameters: ['name', 'color:000000', 'permissions?:0'],
                    execute: (ctx, args, subtag) => this.createRole(ctx, args[0].value, args[1].value, args[2].value, 'false', 'false', subtag)
                },
                {
                    parameters: ['name', 'color:000000', 'permissions:0', 'mentionable:false', 'hoisted?:false'],
                    execute: (ctx, args, subtag) => this.createRole(ctx, args[0].value, args[1].value, args[2].value, args[3].value, args[4].value, subtag)
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
        hoistedStr: string,
        subtag: SubtagCall
    ): Promise<string> {
        const permission = context.permissions.valueOf();
        const topRole = discordUtil.getRoleEditPosition(context);

        if (topRole === 0)
            return this.customError('Author cannot create roles', context, subtag);
        const rolePerms = new Permissions().add(BigInt(parse.int(permStr))).valueOf();
        const options: CreateRoleOptions = {
            name,
            reason: discordUtil.formatAuditReason(context.user, context.scope.reason),
            color: parse.color(colorStr),
            permissions: rolePerms,
            mentionable: parse.boolean(mentionableStr, false),
            hoist: parse.boolean(hoistedStr, false)
        };

        if (isNaN(Number(rolePerms)))
            return this.customError('Permissions not a number', context, subtag);

        if ((rolePerms & BigInt(permission)) !== options.permissions)
            return this.customError('Author missing requested permissions', context, subtag);

        try {
            const role = await context.guild.roles.create(options);
            if (context.guild.roles.cache.get(role.id) === undefined)
                context.guild.roles.cache.set(role.id, role);
            return role.id;
        } catch (err: unknown) {
            context.logger.error(err);
            return this.customError('Failed to create role: no perms', context, subtag);
        }
    }
}
