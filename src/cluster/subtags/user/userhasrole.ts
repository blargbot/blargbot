import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { RoleNotFoundError, UserNotFoundError } from '@blargbot/cluster/bbtag/errors';
import { bbtag, parse, SubtagType } from '@blargbot/cluster/utils';

export class UserHasRoleSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'userhasrole',
            category: SubtagType.USER,
            aliases: ['hasrole'],
            desc: 'This subtag checks if a user has *any* of the provided `roleids`. Use `{userhasroles}` to check if a user has *all* of the provided `roleids`. `roleids` can be an array of role IDs, or a single role ID. For a list of roles and their corresponding IDs, use `b!roles`' +  //TODO context.getRole instead
                '\nReturns a boolean.',
            definition: [
                {
                    parameters: ['roleids'],
                    description: 'Checks if the executing user has *any* of the provided `roleids`.',
                    exampleCode: '{if;{userhasrole;{roleid;moderator}};You are a moderator; You are not a moderator}',
                    exampleOut: 'You are a moderator',
                    returns: 'boolean',
                    execute: (ctx, [roles]) => this.userHasRole(ctx, roles.value, '', false)
                },
                {
                    parameters: ['roleids', 'user', 'quiet?'],
                    description: 'Checks if `user` has *any* of the provided `roleids`. If `quiet` is specified, if `user` or any `roleid` can\'t be found it will simply return `false`.',
                    exampleCode: '{if;{userhasrole;{userid;moderator};Stupid cat};Stupid cat is a moderator;Stupid cat is not a moderator}',
                    exampleOut: 'Stupid cat is a moderator',
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
        for (const role of roleArr) {
            if (member.guild.roles.get(role) === undefined) {
                throw new RoleNotFoundError(role)
                    .withDisplay(quiet ? 'false' : undefined);
            }
        }

        return roleArr.some(r => member.roles.includes(r));
    }
}
