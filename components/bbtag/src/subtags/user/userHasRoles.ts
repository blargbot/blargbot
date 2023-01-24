import { hasValue } from '@blargbot/guards';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userHasRoles;

@Subtag.id('userHasRoles', 'hasRoles')
@Subtag.ctorArgs(Subtag.arrayTools(), Subtag.converter())
export class UserHasRolesSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['roleIds'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles]) => this.userHasRoles(ctx, roles.value, '', false)
                },
                {
                    parameters: ['roleIds', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles, user, quiet]) => this.userHasRoles(ctx, roles.value, user.value, quiet.value !== '')
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public async userHasRoles(
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

        if (!hasValue(member.guild) || !hasValue(member.roles))
            return false;

        const arr = this.#arrayTools.deserialize(roleStr) ?? { v: [roleStr] };
        const roleArr = arr.v.map(x => this.#converter.string(x));
        for (const role of roleArr) {
            if (member.guild.roles.get(role) === undefined) {
                throw new RoleNotFoundError(role)
                    .withDisplay(quiet ? 'false' : undefined);
            }
        }

        return roleArr.every(r => member.roles.includes(r));
    }
}
