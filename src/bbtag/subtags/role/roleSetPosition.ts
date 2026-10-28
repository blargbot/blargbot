import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError, RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToInteger } from '../../utils/converters.js';
import { getEditRoleDetails, SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';
import { RoleIdSubtag } from './roleId.js';
import type { GetRolePositionFeature } from './rolePosition.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from './roles.js';

const tag = templates.subtags.roleSetPosition;

export interface SetRolePositionOptions {
    readonly guildId: string;
    readonly roleId: string;
    readonly position: number;
    readonly auditReason: string;
}

export interface SetRolePositionFeature {
    setRolePosition(options: SetRolePositionOptions): Promise<ApiResult>;
}

type Features = SetRolePositionFeature & GetRolePositionFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature;
export class RoleSetPositionSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleSetPosition',
            aliases: ['roleSetPos'],
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'position', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role, position, quiet]) => this.setRolePosition(ctx, role.value, position.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async setRolePosition(context: BBTagContext, roleStr: string, positionStr: string, quiet: boolean): Promise<boolean> {
        const { guildId, botId, authorizerId } = context.root;
        const { topRoleId, topRoleIndex, roleIndexMap } = await getEditRoleDetails(guildId, [botId, authorizerId], this.#features);
        if (topRoleIndex <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const position = convertToInteger(positionStr);
        if (position === undefined)
            throw new NotANumberError(positionStr);

        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).throw();

        if ((roleIndexMap.get(roleId) ?? 0) >= topRoleIndex)
            throw new BBTagRuntimeError('Role above author');

        const topRolePosition = topRoleId === undefined ? -1 : await this.#features.getRolePosition(guildId, topRoleId) ?? -1;

        if (position >= topRolePosition)
            throw new BBTagRuntimeError('Desired position above author');

        const result = await this.#features.setRolePosition({
            guildId,
            roleId,
            position,
            auditReason: await ReasonSubtag.get(context)
        });
        if (result.success)
            return true;

        throw new BBTagRuntimeError('Failed to edit role: no perms', result.reason)
            .withDisplay(quiet ? 'false' : undefined);
    }
}
