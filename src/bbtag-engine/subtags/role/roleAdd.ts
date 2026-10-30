import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, getEditRoleDetails, SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
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
                    execute: (ctx, [role]) => this.addRole(ctx, role.value, ctx.root.userId, false)
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
        const { guildId, botId, authorizerId } = context.root;
        const { topRoleIndex, roleIndexMap } = await getEditRoleDetails(guildId, [botId, authorizerId], this.#features);
        if (topRoleIndex === 0)
            throw new BBTagRuntimeError('Author cannot add roles');

        quiet ||= context.local.quiet ?? false;
        const targetId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? 'false' : undefined).throw();

        const roleStrs = bbtag.tagArray.deserialize(roleStr)?.v.filter(v => typeof v === 'number' || typeof v === 'string') ?? [roleStr];
        const roles = roleStrs.map(String).filter(v => roleIndexMap.has(v));

        if (roles.length === 0)
            throw new RoleNotFoundError(roleStr);

        const requiredRoleIndex = roles.reduce((p, r) => Math.max(p, roleIndexMap.get(r) ?? 0), 0);
        if (requiredRoleIndex >= topRoleIndex)
            throw new BBTagRuntimeError('Role above author');

        const userRoles = new Set(await this.#features.listMemberRoles(guildId, targetId) ?? []);
        const toAdd = roles.filter(r => !userRoles.has(r));
        if (toAdd.length === 0)
            return false;

        const result = await this.#features.addMemberRoles({
            guildId,
            targetId,
            roleIds: toAdd,
            auditReason: await ReasonSubtag.get(context)
        });
        return result.success;
    }
}
