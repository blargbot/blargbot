import * as Eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.roleCreate;

@Subtag.id('roleCreate')
@Subtag.ctorArgs(Subtag.converter())
export class RoleCreateSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
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

        this.#converter = converter;
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

        const rolePerms = this.#converter.bigInt(permStr);
        if (rolePerms === undefined)
            throw new BBTagRuntimeError('Permission not a number', `${JSON.stringify(permStr)} is not a number`);

        const options: Eris.RoleOptions = {
            name,
            color: this.#converter.color(colorStr),
            permissions: rolePerms,
            mentionable: this.#converter.boolean(mentionableStr, false),
            hoist: this.#converter.boolean(hoistedStr, false)
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
