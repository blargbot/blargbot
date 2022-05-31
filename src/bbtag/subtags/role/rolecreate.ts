import { parse } from '@blargbot/core/utils';
import { DiscordRESTError, RoleOptions } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class RoleCreateSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rolecreate',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['name', 'color?:000000', 'permissions?:0', 'mentionable?:false', 'hoisted?:false'],
                    description: '`color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. ' +
                        'Provide `permissions` as a number, which can be calculated [here](https://discordapi.com/permissions.html) ' +
                        '`hoisted` is if the role should be displayed separately from other roles.\n' +
                        'Returns the new role\'s ID.',
                    exampleCode: '{rolecreate;myNewRole;red}',
                    exampleOut: '1298731238361728931',
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
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot create roles');

        const rolePerms = parse.bigInt(permStr);
        if (rolePerms === undefined)
            throw new BBTagRuntimeError('Permission not a number', `${JSON.stringify(permStr)} is not a number`);

        const options: RoleOptions = {
            name,
            color: parse.color(colorStr),
            permissions: rolePerms,
            mentionable: parse.boolean(mentionableStr, false),
            hoist: parse.boolean(hoistedStr, false)
        };

        if (!context.hasPermission(rolePerms))
            throw new BBTagRuntimeError('Author missing requested permissions');

        try {
            const role = await context.guild.createRole(options, context.auditReason());
            if (context.guild.roles.get(role.id) === undefined)
                context.guild.roles.set(role.id, role);
            return role.id;
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to create role: no perms', err.message);
        }
    }
}
