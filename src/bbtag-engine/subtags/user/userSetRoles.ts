import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToString } from '../../utils/converters.js';
import { bbtag, getEditRoleDetails, SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import { RoleIdSubtag } from '../role/roleId.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from '../role/roles.js';
import type { ApiResult, GetMemberPermissionsFeature, VariablesFeature } from '../types.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userSetRoles;

export interface SetMemberRolesOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly roleIds: readonly string[];
    readonly auditReason: string;
}

export interface SetMemberRolesFeature {
    setMemberRoles(options: SetMemberRolesOptions): Promise<ApiResult>;
}

type Features = SetMemberRolesFeature & ListMemberRolesFeature & ListGuildRolesFeature & GetMemberPermissionsFeature & VariablesFeature;
export class UserSetRolesSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userSetRoles',
            aliases: ['setRoles'],
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['roleArray?'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles]) => this.userSetRole(ctx, roles.value, ctx.root.userId, false)
                },
                {
                    parameters: ['roleArray', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles, user, quiet]) => this.userSetRole(ctx, roles.value, user.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async userSetRole(
        context: BBTagContext,
        rolesStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        const { guildId, botId, authorizerId } = context.root;
        const { topRoleIndex } = await getEditRoleDetails(guildId, [botId, authorizerId], this.#features);
        if (topRoleIndex === 0)
            throw new BBTagRuntimeError('Author cannot remove roles');

        /*
         * Quiet suppresses all errors here instead of just the user errors
         * I feel like that is how it *should* work
        */
        quiet ||= context.local.quiet ?? false;
        const targetId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? 'false' : undefined).throw();

        const variables = this.#features.variables.forContext(context);
        const roleArr = await bbtag.tagArray.deserializeOrGetArray(variables, rolesStr !== '' ? rolesStr : '[]');
        if (roleArr === undefined) {
            throw new NotAnArrayError(rolesStr)
                .withDisplay(quiet ? 'false' : undefined);
        }

        const parsedRoles: string[] = [];

        for (const roleStr of roleArr.v.map(convertToString)) {
            parsedRoles.push(
                await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
                ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? 'false' : undefined).throw()
            );
        }

        const result = await this.#features.setMemberRoles({
            guildId: context.root.guildId,
            targetId,
            roleIds: parsedRoles,
            auditReason: await ReasonSubtag.get(context)
        });
        return result.success;
    }
}
