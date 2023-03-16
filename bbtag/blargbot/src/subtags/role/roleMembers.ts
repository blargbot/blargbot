import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { RoleNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roleMembers;

@Subtag.id('roleMembers')
@Subtag.ctorArgs('roles', 'users')
export class RoleMembersSubtag extends CompiledSubtag {
    readonly #roles: RoleService;
    readonly #users: UserService;

    public constructor(roles: RoleService, users: UserService) {
        super({
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx, [roleId, quiet]) => this.getRoleMembers(ctx, roleId.value, quiet.value !== '')
                }
            ]
        });

        this.#roles = roles;
        this.#users = users;
    }

    public async getRoleMembers(
        context: BBTagScript,
        roleId: string,
        quiet: boolean
    ): Promise<string[]> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const role = await this.#roles.querySingle(context.runtime, roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        const users = await this.#users.getAll(context.runtime);
        const usersInRole = users.filter(u => u.member?.roles.includes(role.id) === true);
        return usersInRole.map(m => m.id);
    }
}
