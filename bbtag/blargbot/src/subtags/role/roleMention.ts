import { parse } from '@blargbot/core/utils/index.js';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { NotABooleanError, RoleNotFoundError } from '@bbtag/engine';

export class RoleMentionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roleMention',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?', 'noPing?:false'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [roleId, quiet, noPing]) => this.roleMention(ctx, roleId.value, quiet.value !== '', noPing.value)
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
                .withDisplay(quiet ? '' : undefined);
        }

        if (!noPing && !context.data.allowedMentions.roles.includes(role.id))
            context.data.allowedMentions.roles.push(role.id);
        return role.mention;
    }
}
