import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RoleMentionSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolemention',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns a mention of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role will be mentioned: {rolemention;Admin}',
                    exampleOut: 'The admin role will be mentioned: @\u200BAdminstrator',
                    execute: (ctx, [roleId, quiet]) => this.roleMention(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async roleMention(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role !== undefined) {
            if (!context.state.allowedMentions.roles.includes(role.id)) {
                context.state.allowedMentions.roles.push(role.id);
            }
            return role.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
