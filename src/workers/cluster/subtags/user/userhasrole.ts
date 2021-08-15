import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, SubtagType } from '@cluster/utils';

export class UserHasRoleSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userhasrole',
            category: SubtagType.API,
            aliases: ['hasrole'],
            desc: 'This subtag checks if a user has *any* of the provided `roleids`. Use `{userhasroles}` to check if a user has *all* of the provided `roleids`. `roleids` can be an array of role IDs, or a single role ID. For a list of roles and their corresponding IDs, use `b!roles`' +  //TODO context.getRole instead
                '\nReturns a boolean.',
            definition: [
                {
                    parameters: ['roleids'],
                    description: 'Checks if the executing user has *any* of the provided `roleids`.',
                    exampleCode: '{if;{userhasrole;{roleid;moderator}};You are a moderator; You are not a moderator}',
                    exampleOut: 'You are a moderator',
                    execute: (ctx, args, subtag) => this.userHasRole(ctx, args[0].value, '', false, subtag)
                },
                {
                    parameters: ['roleids', 'user', 'quiet?'],
                    description: 'Checks if `user` has *any* of the provided `roleids`. If `quiet` is specified, if `user` or any `roleid` can\'t be found it will simply return `false`.',
                    exampleCode: '{if;{userhasrole;{userid;moderator};Stupid cat};Stupid cat is a moderator;Stupid cat is not a moderator}',
                    exampleOut: 'Stupid cat is a moderator',
                    execute: (ctx, args, subtag) => this.userHasRole(ctx, args[0].value, args[1].value, args[2].value !== '', subtag)
                }
            ]
        });
    }

    public async userHasRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quiet: boolean,
        subtag: SubtagCall
    ): Promise<string> {
        const result = await discordUtil.checkRoles(context, roleStr, userStr, quiet);

        if (result.member === undefined)
            return quiet ? 'false' : this.noUserFound(context, subtag);
        if (result.roles.length === 0)
            return quiet ? 'false' : this.noRoleFound(context, subtag);

        return result.hasRole.reduce((a, b) => a || b, false).toString();
    }
}
