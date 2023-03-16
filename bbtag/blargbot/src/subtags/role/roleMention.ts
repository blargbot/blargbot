import { markup } from '@blargbot/discord-util';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError, RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.roleMention;

@Subtag.id('roleMention')
@Subtag.ctorArgs('converter', 'roles')
export class RoleMentionSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #roles: RoleService;

    public constructor(converter: BBTagValueConverter, roles: RoleService) {
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
        this.#roles = roles;
    }

    public async roleMention(
        context: BBTagScript,
        roleId: string,
        quiet: boolean,
        noPingStr: string
    ): Promise<string> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const noPing = this.#converter.boolean(noPingStr);
        if (noPing === undefined)
            throw new NotABooleanError(noPing);

        const role = await this.#roles.querySingle(context.runtime, roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        if (!noPing)
            context.runtime.outputOptions.mentionRoles.add(role.id);
        return markup.role(role.id);
    }
}
