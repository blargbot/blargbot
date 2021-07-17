import { BaseSubtag, SubtagType, BBTagContext } from '@cluster/core';

export class RoleMentionSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolemention',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns a mention of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role will be mentioned: {rolemention;Admin}',
                    exampleOut: 'The admin role will be mentioned: @\u200BAdminstrator',
                    execute: (ctx, [roleId, quietStr]) => this.roleMention(ctx, roleId.value, quietStr.value)
                }
            ]
        });
    }

    public async roleMention(
        context: BBTagContext,
        roleId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const role = await context.getRole(roleId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
        });

        if (role !== undefined) {
            if (!context.state.allowedMentions.roles.includes(role.id)) {
                context.state.allowedMentions.roles.push(role.id);
            }
            return role.mention;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
