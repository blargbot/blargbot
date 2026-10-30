import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { DiscordPermissions } from '../../enums.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToBigInt, convertToBoolean, convertToColor } from '../../utils/converters.js';
import { getEditRoleDetails, SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from './roles.js';

const tag = templates.subtags.roleCreate;

export type CreateRoleResult = ApiResult<{ roleId: string; }>

export interface CreateRoleOptions {
    readonly guildId: string;
    readonly name: string;
    readonly color: number | undefined;
    readonly permissions: DiscordPermissions;
    readonly mentionable: boolean;
    readonly hoist: boolean;
    readonly auditReason: string;
}

export interface CreateRoleFeature {
    createRole(options: CreateRoleOptions): Promise<CreateRoleResult>;
}

type Features = CreateRoleFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature;
export class RoleCreateSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async createRole(
        context: BBTagContext,
        name: string,
        colorStr: string,
        permStr: string,
        mentionableStr: string,
        hoistedStr: string
    ): Promise<string> {
        const { guildId, botId, authorizerId } = context.root;
        const { topRoleIndex, permissions } = await getEditRoleDetails(guildId, [botId, authorizerId], this.#features);
        if (topRoleIndex <= 0)
            throw new BBTagRuntimeError('Author cannot create roles');

        const rolePerms = convertToBigInt(permStr);
        if (rolePerms === undefined)
            throw new BBTagRuntimeError('Permission not a number', `${JSON.stringify(permStr)} is not a number`);

        const options: CreateRoleOptions = {
            guildId,
            name,
            color: convertToColor(colorStr),
            permissions: new DiscordPermissions(rolePerms),
            mentionable: convertToBoolean(mentionableStr) ?? false,
            hoist: convertToBoolean(hoistedStr) ?? false,
            auditReason: await ReasonSubtag.get(context)
        };

        if (!permissions.has('ADMINISTRATOR') && !permissions.has(rolePerms))
            throw new BBTagRuntimeError('Author missing requested permissions');

        const result = await this.#features.createRole(options);
        if (result.success)
            return result.roleId;

        throw new BBTagRuntimeError('Failed to create role: no perms', result.reason);
    }
}
