import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { getEditRoleDetails, SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';
import { RoleIdSubtag } from './roleId.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from './roles.js';

const tag = templates.subtags.roleDelete;

export interface DeleteRoleOptions {
    readonly guildId: string;
    readonly roleId: string;
    readonly auditReason: string;
}

export interface DeleteRoleFeature {
    deleteRole(options: DeleteRoleOptions): Promise<ApiResult>;
}

type Features = DeleteRoleFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature;
export class RoleDeleteSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleDelete',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [role, quiet]) => this.deleteRole(ctx, role.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async deleteRole(context: BBTagContext, roleStr: string, quiet: boolean): Promise<void> {
        const { guildId, botId, authorizerId } = context.root;
        const { topRoleIndex, roleIndexMap } = await getEditRoleDetails(guildId, [botId, authorizerId], this.#features);
        if (topRoleIndex <= 0)
            throw new BBTagRuntimeError('Author cannot delete roles');

        quiet ||= context.local.quiet ?? false;
        const roleId = await RoleIdSubtag.query(context, roleStr, { noErrors: quiet, noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();

        if ((roleIndexMap.get(roleId) ?? 0) >= topRoleIndex)
            throw new BBTagRuntimeError('Role above author');

        const result = await this.#features.deleteRole({
            guildId,
            roleId,
            auditReason: await ReasonSubtag.get(context)
        });
        if (result.success)
            return;

        throw new BBTagRuntimeError('Failed to delete role: no perms', result.reason)
            .withDisplay(quiet ? '' : undefined);
    }
}
