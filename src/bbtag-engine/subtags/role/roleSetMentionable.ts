import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToBoolean } from '../../utils/converters.js';
import { getEditRoleDetails, SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { EditRoleFeature, GetMemberPermissionsFeature } from '../types.js';
import { RoleIdSubtag } from './roleId.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from './roles.js';

const tag = templates.subtags.roleSetMentionable;

export interface SetRoleMentionableOptions {
    readonly guildId: string;
    readonly roleId: string;
    readonly mentionable: boolean;
    readonly auditReason: string;
}

type Features = EditRoleFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature;
export class RoleSetMentionableSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleSetMentionable',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.enable.description,
                    exampleCode: tag.enable.exampleCode,
                    exampleOut: tag.enable.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role]) => this.setRolementionable(ctx, role.value, 'true', false)
                },
                {
                    parameters: ['role', 'value:true', 'quiet?'],
                    description: tag.set.description,
                    exampleCode: tag.set.exampleCode,
                    exampleOut: tag.set.exampleOut,
                    returns: 'nothing', //TODO output like true/false
                    execute: (ctx, [role, value, quiet]) => this.setRolementionable(ctx, role.value, value.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async setRolementionable(
        context: BBTagContext,
        roleStr: string,
        toggleStr: string,
        quiet: boolean
    ): Promise<void> {
        const { guildId, botId, authorizerId } = context.root;
        const { topRoleIndex, roleIndexMap } = await getEditRoleDetails(guildId, [botId, authorizerId], this.#features);
        if (topRoleIndex <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.local.quiet ?? false;
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new BBTagRuntimeError('Role not found').throw(); //TODO RoleNotFoundError instead

        const mentionable = convertToBoolean(toggleStr) ?? false;

        if ((roleIndexMap.get(roleId) ?? 0) >= topRoleIndex)
            throw new BBTagRuntimeError('Role above author');

        const result = await this.#features.editRole({
            guildId,
            roleId,
            mentionable,
            auditReason: await ReasonSubtag.get(context)
        });
        if (result.success)
            return;

        throw new BBTagRuntimeError('Failed to edit role: no perms', result.reason)
            .withDisplay(quiet ? '' : undefined);
    }
}
