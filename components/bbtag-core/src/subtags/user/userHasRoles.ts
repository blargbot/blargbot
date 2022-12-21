import { guard, parse } from '@blargbot/core/utils/index.js';

import { RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class UserHasRolesSubtag extends Subtag {
    public constructor() {
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
    }

    public async userHasRoles(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userStr, { noLookup: quiet });
        if (member === undefined)
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? 'false' : undefined);

        if (!guard.hasValue(member.guild) || !guard.hasValue(member.roles))
            return false;

        const arr = bbtag.tagArray.deserialize(roleStr) ?? { v: [roleStr] };
        const roleArr = arr.v.map(x => parse.string(x));
        for (const role of roleArr) {
            if (member.guild.roles.get(role) === undefined) {
                throw new RoleNotFoundError(role)
                    .withDisplay(quiet ? 'false' : undefined);
            }
        }

        return roleArr.every(r => member.roles.includes(r));
    }
}
