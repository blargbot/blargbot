import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToString } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { ListGuildRolesFeature, ListMemberRolesFeature } from '../role/roles.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userHasRoles;

type Features = ListMemberRolesFeature & ListGuildRolesFeature;
export class UserHasRolesSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userHasRoles',
            category: SubtagType.USER,
            aliases: ['hasRoles'],
            description: tag.description,
            definition: [
                {
                    parameters: ['roleIds'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles]) => this.userHasRoles(ctx, roles.value, '', false)
                },
                {
                    parameters: ['roleIds', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles, user, quiet]) => this.userHasRoles(ctx, roles.value, user.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async userHasRoles(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? 'false' : undefined).throw();

        const userRoles = new Set(await this.#features.listMemberRoles(context.root.guildId, userId));
        const guildRoles = new Set(await this.#features.listGuildRoles(context.root.guildId));

        const arr = bbtag.tagArray.deserialize(roleStr) ?? { v: [roleStr] };
        const roleArr = arr.v.map(convertToString);
        for (const role of roleArr) {
            if (!guildRoles.has(role)) {
                throw new RoleNotFoundError(role)
                    .withDisplay(quiet ? 'false' : undefined);
            }
        }

        return roleArr.every(r => userRoles.has(r));
    }
}
