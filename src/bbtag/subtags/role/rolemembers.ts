import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { RoleNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.rolemembers;

export class RoleMembersSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rolemembers',
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
    }

    public async getRoleMembers(
        context: BBTagContext,
        roleId: string,
        quiet: boolean
    ): Promise<string[]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const role = await context.queryRole(roleId, { noLookup: quiet });

        if (role === undefined) {
            throw new RoleNotFoundError(roleId)
                .withDisplay(quiet ? '' : undefined);
        }

        const members = await context.guild.fetchMembers();
        const membersInRole = members.filter(m => m.roles.includes(role.id));
        return membersInRole.map(m => m.user.id);
    }
}
