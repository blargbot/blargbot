import { parse } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';

export class RoleCreateSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roleCreate',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['name', 'color?:000000', 'permissions?:0', 'mentionable?:false', 'hoisted?:false'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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

        const options: Eris.RoleOptions = {
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
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to create role: no perms', err.message);
        }
    }
}
