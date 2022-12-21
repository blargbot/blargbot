import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { RoleNotFoundError } from '../../errors/index.js';
import { /*parse,*/ SubtagType } from '../../utils/index.js';

export class RoleSizeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'roleSize',
            category: SubtagType.ROLE,
            aliases: ['inRole'],
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
    }

    public async getRoleSize(context: BBTagContext, roleStr: string/*, quiet: boolean*/): Promise<number> {
        /* quiet ||= context.scopes.local.quiet ?? false */
        /* const role = await context.queryRole(roleStr, {
            quiet
        }) */
        const role = await context.queryRole(roleStr, { noLookup: true, noErrors: true });
        if (role === undefined)
            throw new RoleNotFoundError(roleStr);

        await context.util.ensureMemberCache(context.guild);
        return context.guild.members.filter(m => m.roles.includes(role.id)).length;
    }
}
