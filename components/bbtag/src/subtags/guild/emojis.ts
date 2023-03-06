import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.emojis;

//TODO IMO this should return an array of emoji IDs instead of an array of emojis
@Subtag.names('emojis')
@Subtag.ctorArgs('role')
export class EmojisSubtag extends CompiledSubtag {
    readonly #roles: RoleService;

    public constructor(roles: RoleService) {
        super({
            category: SubtagType.GUILD,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.all.description,
                    exampleCode: tag.all.exampleCode,
                    exampleOut: tag.all.exampleOut,
                    returns: 'string[]',
                    execute: (context) => this.getAllEmojis(context)
                },
                {
                    parameters: ['role'],
                    description: tag.forRole.description,
                    exampleCode: tag.forRole.exampleCode,
                    exampleOut: tag.forRole.exampleOut,
                    returns: 'string[]',
                    execute: (ctx, [role]) => this.getEmojisForRole(ctx, role.value)
                }
            ]
        });

        this.#roles = roles;
    }

    public getAllEmojis(context: BBTagContext): string[] {
        return context.guild.emojis.map(e => `<${e.animated === true ? 'a' : ''}:${e.name ?? ''}:${e.id ?? ''}>`);
    }

    public async getEmojisForRole(context: BBTagContext, roleStr: string): Promise<string[]> {
        const role = await this.#roles.querySingle(context, roleStr, { noErrors: true, noLookup: true });

        // if (role === undefined)
        //     throw new RoleNotFoundError(roleStr) //TODO add this to other role subtags too, but when versioning is a thing to avoid incompatibilities

        const roleId = role?.id ?? roleStr;

        const emojis = context.guild.emojis.filter(e => e.roles?.includes(roleId) === true)
            .map(e => `<${e.animated === true ? 'a' : ''}:${e.name ?? ''}:${e.id ?? ''}>`);
        return emojis;
    }
}
