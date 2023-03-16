import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.userHasRole;

@Subtag.id('userHasRole', 'hasRole')
@Subtag.ctorArgs('arrayTools', 'converter', 'users')
export class UserHasRoleSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;
    readonly #users: UserService;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter, users: UserService) {
        super({
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['roleids'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles]) => this.userHasRole(ctx, roles.value, '', false)
                },
                {
                    parameters: ['roleids', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles, user, quiet]) => this.userHasRole(ctx, roles.value, user.value, quiet.value !== '')
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
        this.#users = users;
    }

    public async userHasRole(
        context: BBTagScript,
        roleStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const user = await this.#users.querySingle(context.runtime, userStr, { noLookup: quiet });
        if (user?.member === undefined)
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? 'false' : undefined);

        const arr = this.#arrayTools.deserialize(roleStr) ?? { v: [roleStr] };
        const roleArr = arr.v.map(x => this.#converter.string(x));
        const roleIds = new Set(context.runtime.guild.roles.map(r => r.id));

        if (roleArr.every(role => !roleIds.has(role)))
            throw new RoleNotFoundError(roleStr)
                .withDisplay(quiet ? 'false' : undefined);

        const userRoles = new Set(user.member.roles);
        return roleArr.some(r => userRoles.has(r));
    }
}
