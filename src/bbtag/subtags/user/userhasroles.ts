import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { RoleNotFoundError, UserNotFoundError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

export class UserHasRolesSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'userhasroles',
            category: SubtagType.USER,
            aliases: ['hasroles'],
            desc: 'This subtag checks if a user has *all* of the provided `roleids`. Use `{userhasrole}` to check if a user has *any* of the provided `roleids`. `roleids` can be an array of role IDs, or a single role ID. For a list of roles and their corresponding IDs, use `b!roles`' +  //TODO context.getRole instead
                '\nReturns a boolean.',
            definition: [
                {
                    parameters: ['roleids'],
                    description: 'Checks if the executing user has *all* of the provided `roleids`.',
                    exampleCode: '{if;{userhasroles;["{roleid;moderator}","{roleid;admin}"];You are a moderator and admin; You are not a moderator and admin}',
                    exampleOut: 'You are not a moderator and admin',
                    returns: 'boolean',
                    execute: (ctx, [roles]) => this.userHasRoles(ctx, roles.value, '', false)
                },
                {
                    parameters: ['roleids', 'user', 'quiet?'],
                    description: 'Checks if `user` has *all* of the provided `roleids`. If `quiet` is specified, if `user` or any `roleid` can\'t be found it will simply return `false`.',
                    exampleCode: '{if;{userhasroles;["{roleid;moderator}","{roleid;admin}"];Stupid cat};Stupid cat is a moderator and admin;Stupid cat is not a moderator and admin}',
                    exampleOut: 'Stupid cat is a moderator and admin',
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
