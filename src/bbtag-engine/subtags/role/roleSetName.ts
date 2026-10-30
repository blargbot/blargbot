import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { getEditRoleDetails, SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { EditRoleFeature, GetMemberPermissionsFeature } from '../types.js';
import { RoleIdSubtag } from './roleId.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from './roles.js';

const tag = templates.subtags.roleSetName;

export interface SetRoleNameOptions {
    readonly guildId: string;
    readonly roleId: string;
    readonly name: string;
    readonly auditReason: string;
}

type Features = EditRoleFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature;
export class RoleSetNameSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleSetName',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'name', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role, name, quiet]) => this.setRolename(ctx, role.value, name.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async setRolename(
        context: BBTagContext,
        roleStr: string,
        name: string,
        quiet: boolean
    ): Promise<void> {
        const { guildId, botId, authorizerId } = context.root;
        const { topRoleIndex, roleIndexMap } = await getEditRoleDetails(guildId, [botId, authorizerId], this.#features);
        if (topRoleIndex <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.local.quiet ?? false;
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).throw();

        if ((roleIndexMap.get(roleId) ?? 0) >= topRoleIndex)
            throw new BBTagRuntimeError('Role above author');

        const result = await this.#features.editRole({
            guildId,
            roleId,
            name,
            auditReason: await ReasonSubtag.get(context)
        });
        if (result.success)
            return;

        throw new BBTagRuntimeError('Failed to edit role: no perms', result.reason)
            .withDisplay(quiet ? '' : undefined);
    }
}
