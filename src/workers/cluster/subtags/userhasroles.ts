import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, SubtagType } from '@cluster/utils';

export class UserHasRolesSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userhasroles',
            category: SubtagType.API,
            aliases: ['hasroles'],
            desc: 'This subtag checks if a user has *all* of the provided `roleids`. Use `{userhasrole}` to check if a user has *any* of the provided `roleids`. `roleids` can be an array of role IDs, or a single role ID. For a list of roles and their corresponding IDs, use `b!roles`' +  //TODO context.getRole instead
                '\nReturns a boolean.',
            definition: [
                {
                    parameters: ['roleids'],
                    description: 'Checks if the executing user has *all* of the provided `roleids`.',
                    exampleCode: '{if;{userhasroles;["{roleid;moderator}","{roleid;admin}"];You are a moderator and admin; You are not a moderator and admin}',
                    exampleOut: 'You are not a moderator and admin',
                    execute: (ctx, args, subtag) => this.userHasRoles(ctx, args[0].value, '', false, subtag)
                },
                {
                    parameters: ['roleids', 'user', 'quiet?'],
                    description: 'Checks if `user` has *all* of the provided `roleids`. If `quiet` is specified, if `user` or any `roleid` can\'t be found it will simply return `false`.',
                    exampleCode: '{if;{userhasroles;["{roleid;moderator}","{roleid;admin}"];Stupid cat};Stupid cat is a moderator and admin;Stupid cat is not a moderator and admin}',
                    exampleOut: 'Stupid cat is a moderator and admin',
                    execute: (ctx, args, subtag) => this.userHasRoles(ctx, args[0].value, args[1].value, args[2].value !== '', subtag)
                }
            ]
        });
    }

    public async userHasRoles(
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

        return result.hasRole.reduce((a, b) => a && b, true).toString();
    }
}
