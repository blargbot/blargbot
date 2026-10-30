import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError, RoleNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToBoolean } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import { RoleIdSubtag } from './roleId.js';

const tag = templates.subtags.roleMention;

export class RoleMentionSubtag extends CompiledSubtag {
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
        roleStr: string,
        quiet: boolean,
        noPingStr: string
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const noPing = convertToBoolean(noPingStr);
        if (noPing === undefined)
            throw new NotABooleanError(noPing);

        const roleId = await RoleIdSubtag.query(context, roleStr, { noLookup: quiet })
            ?? new RoleNotFoundError(roleStr).withDisplay(quiet ? '' : undefined).throw();

        if (!noPing)
            context.root.allowedMentions.roles.add(roleId);

        return `<@&${roleId}>`;
    }
}
