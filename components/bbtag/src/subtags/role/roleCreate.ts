import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { Entities } from '../../types.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.roleCreate;

@Subtag.names('roleCreate')
@Subtag.ctorArgs('converter', 'role')
export class RoleCreateSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #roles: RoleService;

    public constructor(converter: BBTagValueConverter, roles: RoleService) {
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
        this.#roles = roles;
    }

    public async createRole(
        context: BBTagContext,
        name: string,
        colorStr: string,
        permStr: string,
        mentionableStr: string,
        hoistedStr: string
    ): Promise<string> {
        const topRole = context.roleEditPosition(context.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot create roles');

        const rolePerms = this.#converter.bigInt(permStr);
        if (rolePerms === undefined)
            throw new BBTagRuntimeError('Permission not a number', `${JSON.stringify(permStr)} is not a number`);

        const options: Entities.RoleCreate = {
            name,
            color: this.#converter.color(colorStr),
            permissions: rolePerms,
            mentionable: this.#converter.boolean(mentionableStr, false),
            hoist: this.#converter.boolean(hoistedStr, false)
        };

        if ((context.authorizerPermissions & rolePerms) !== rolePerms)
            throw new BBTagRuntimeError('Author missing requested permissions');

        const result = await this.#roles.create(context, options);

        if (!('error' in result))
            return result.id;

        throw new BBTagRuntimeError('Failed to create role: no perms', result.error);
    }
}
