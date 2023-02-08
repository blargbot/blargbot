import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roleSize;

@Subtag.names('roleSize', 'inRole')
@Subtag.ctorArgs(Subtag.service('role'), Subtag.service('user'))
export class RoleSizeSubtag extends CompiledSubtag {
    readonly #roles: RoleService;
    readonly #users: UserService;

    public constructor(roles: RoleService, users: UserService) {
        super({
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'/*, 'quiet?:false'*/], //TODO uncomment quiet parameter for new code
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [role/*, quiet */]) => this.getRoleSize(ctx, role.value/*, quiet.value !== '' */)
                }
            ]
        });

        this.#roles = roles;
        this.#users = users;
    }

    public async getRoleSize(context: BBTagContext, roleStr: string/*, quiet: boolean*/): Promise<number> {
        /* quiet ||= context.scopes.local.quiet ?? false */
        /* const role = await this.#roles.querySingle(context, roleStr, {
            quiet
        }) */
        const role = await this.#roles.querySingle(context, roleStr, { noLookup: true, noErrors: true });
        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        const users = await this.#users.getAll(context);
        return users.filter(u => u.member?.roles.includes(role.id) === true).length;
    }
}
