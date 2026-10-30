import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { DiscordPermissions } from '../../enums.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToBigInt } from '../../utils/converters.js';
import { getEditRoleDetails, SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { EditRoleFeature, GetMemberPermissionsFeature } from '../types.js';
import { RoleIdSubtag } from './roleId.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from './roles.js';

const tag = templates.subtags.roleSetPermissions;

export interface SetRolePermissionsOptions {
    readonly guildId: string;
    readonly roleId: string;
    readonly permissions: DiscordPermissions;
    readonly auditReason: string;
}

type Features = EditRoleFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature;
export class RoleSetPermissionsSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleSetPermissions',
            category: SubtagType.ROLE,
            aliases: ['roleSetPerms'],
            definition: [
                {
                    parameters: ['role'],
                    description: tag.clear.description,
                    exampleCode: tag.clear.exampleCode,
                    exampleOut: tag.clear.exampleOut, //TODO meaningful output
                    returns: 'nothing',
                    execute: (ctx, [role]) => this.roleSetPerms(ctx, role.value, '0', '')
                },
                {
                    parameters: ['role', 'permissions:0', 'quiet?'],
                    description: tag.set.description,
                    exampleCode: tag.set.exampleCode,
                    exampleOut: tag.set.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [role, permissions, quiet]) => this.roleSetPerms(ctx, role.value, permissions.value, quiet.value)
                }
            ]
        });
        this.#features = features;
    }

    public async roleSetPerms(
        context: BBTagContext,
        roleStr: string,
        permsStr: string,
        quietStr: string
    ): Promise<void> {
        const { guildId, botId, authorizerId } = context.root;
        const { topRoleIndex, roleIndexMap, permissions } = await getEditRoleDetails(guildId, [botId, authorizerId], this.#features);
        if (topRoleIndex <= 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const quiet = typeof context.local.quiet === 'boolean' ? context.local.quiet : quietStr !== '';
        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new BBTagRuntimeError('Role not found').throw();
        const requestedPermissions = convertToBigInt(permsStr) ?? 0n;

        if ((roleIndexMap.get(roleId) ?? 0) >= topRoleIndex)
            throw new BBTagRuntimeError('Role above author');

        const result = await this.#features.editRole({
            guildId,
            roleId,
            permissions: permissions.has('ADMINISTRATOR')
                ? new DiscordPermissions(requestedPermissions)
                : permissions.and(requestedPermissions),
            auditReason: await ReasonSubtag.get(context)
        });
        if (result.success)
            return;

        throw new BBTagRuntimeError('Failed to edit role: no perms', result.reason)
            .withDisplay(quiet ? '' : undefined);
    }
}
