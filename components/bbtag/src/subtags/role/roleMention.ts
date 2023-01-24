import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError, RoleNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.roleMention;

@Subtag.id('roleMention')
@Subtag.factory(Subtag.converter())
export class RoleMentionSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
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

        this.#converter = converter;
    }

    public async roleMention(
        context: BBTagContext,
        roleId: string,
        quiet: boolean,
        noPingStr: string
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const noPing = this.#converter.boolean(noPingStr);
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
