import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotABooleanError, RoleNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class RoleMentionSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `rolemention`,
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: [`role`, `quiet?`, `noPing?:false`],
                    description: `Returns a mention of \`role\`. If \`quiet\` is specified, if \`role\` can't be found it will simply return nothing.`,
                    exampleCode: `The admin role will be mentioned: {rolemention;Admin}`,
                    exampleOut: `The admin role will be mentioned: @\u200BAdminstrator`,
                    returns: `string`,
                    execute: (ctx, [roleId, quiet, noPing]) => this.roleMention(ctx, roleId.value, quiet.value !== ``, noPing.value)
                }
            ]
        });
    }

    public async roleMention(
        context: BBTagContext,
        roleId: string,
        quiet: boolean,
        noPingStr: string
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const noPing = parse.boolean(noPingStr);
        if (noPing === undefined)
            throw new NotABooleanError(noPing);

        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? `` : undefined);
        }

        if (!noPing && !context.data.allowedMentions.roles.includes(role.id))
            context.data.allowedMentions.roles.push(role.id);
        return role.mention;
    }
}
