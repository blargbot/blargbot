import { RoleNotFoundError, UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import { guard, parse } from '@blargbot/core/utils/index.js';

import { bbtag, SubtagType } from '../../utils/index.js';

export class UserHasRoleSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userHasRole',
            category: SubtagType.USER,
            aliases: ['hasRole'],
            description: tag.description,
            definition: [
                {
                    parameters: ['roleids'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles]) => this.userHasRole(ctx, roles.value, '', false)
                },
                {
                    parameters: ['roleids', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles, user, quiet]) => this.userHasRole(ctx, roles.value, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async userHasRole(
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

        const arr = bbtag.tagArray.deserialize(roleStr) ?? { v: [roleStr] };
        const roleArr = arr.v.map(x => parse.string(x));
        if (!guard.hasValue(member.guild) || !guard.hasValue(member.roles))
            return false;

        if (roleArr.every(role => member.guild.roles.get(role) === undefined))
            throw new RoleNotFoundError(roleStr)
                .withDisplay(quiet ? 'false' : undefined);

        return roleArr.some(r => member.roles.includes(r));
    }
}
