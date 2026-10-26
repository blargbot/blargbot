import { guard } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';
import { UserIdSubtag } from '../user/userId.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from './roles.js';

const tag = templates.subtags.roleAdd;

export interface AddMemberRolesOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly roleIds: readonly string[];
    readonly auditReason: string;
}

export interface AddMemberRolesFeature {
    addMemberRoles(options: AddMemberRolesOptions): Promise<ApiResult>;
}

type Features = AddMemberRolesFeature & ListMemberRolesFeature & ListGuildRolesFeature & GetMemberPermissionsFeature
export class RoleAddSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'roleAdd',
            category: SubtagType.ROLE,
            aliases: ['addRole'],
            description: tag.description,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role]) => this.addRole(ctx, role.value, ctx.root.message.author.id, false)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: tag.other.description,
                    exampleCode: tag.other.exampleCode,
                    exampleOut: tag.other.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role, user, quiet]) => this.addRole(ctx, role.value, user.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async addRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        const { guildId, botId, authorizerId = '' } = context.root;
        const guildRoles = await this.#features.listGuildRoles(guildId);
        const roleIndexes = new Map(guildRoles.map((r, i) => [r, i]));
        const editRoleIndex = Math.min(
            await this.#getEditRoleIndex(guildId, botId, roleIndexes),
            await this.#getEditRoleIndex(guildId, authorizerId, roleIndexes)
        );
        if (editRoleIndex === 0)
            throw new BBTagRuntimeError('Author cannot add roles');

        quiet ||= context.local.quiet ?? false;
        const targetId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? 'false' : undefined).throw();

        const roleStrs = bbtag.tagArray.deserialize(roleStr)?.v.filter(guard.isTypeOf('string', 'number')) ?? [roleStr];
        const roles = roleStrs.map(String).filter(v => roleIndexes.has(v));

        if (roles.length === 0)
            throw new RoleNotFoundError(roleStr);

        const topRoleIndex = roles.reduce((p, r) => Math.max(p, roleIndexes.get(r) ?? 0), 0);
        if (topRoleIndex >= editRoleIndex)
            throw new BBTagRuntimeError('Role above author');

        const userRoles = new Set(await this.#features.listMemberRoles(guildId, targetId) ?? []);
        const toAdd = roles.filter(r => !userRoles.has(r));
        if (toAdd.length === 0)
            return false;

        const result = await this.#features.addMemberRoles({
            guildId,
            targetId,
            roleIds: toAdd,
            auditReason: context.auditReason()
        });
        return result.success;
    }

    async #getEditRoleIndex(guildId: string, userId: string, roleIndexes: Map<string, number>): Promise<number> {
        const permissions = await this.#features.getMemberPermissions(guildId, userId);
        if (!permissions.hasAny('ADMINISTRATOR', 'MANAGE_ROLES'))
            return 0;
        const roles = await this.#features.listMemberRoles(guildId, userId);
        const topRole = roles?.at(-1);
        if (topRole === undefined)
            return 0;
        return roleIndexes.get(topRole) ?? 0;
    }
}
