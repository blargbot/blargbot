import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

//TODO IMO this should return an array of emoji IDs instead of an array of emojis
export class EmojisSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'emojis',
            category: SubtagType.GUILD,
            desc: 'Please not that Discord will remove all the emojis from a message which contains an emoji that blarg can\'t use. For example, blargbot can\'t use a role-restricted emoji if it doesn\'t have the role. Learn more [here](https://discordapp.com/developers/docs/resources/emoji).',
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of emojis in the current guild.',
                    exampleCode: 'This guild has {length;{emojis}} emojis.',
                    exampleOut: 'This guild has 23 emojis.',
                    returns: 'string[]',
                    execute: (context) => this.getAllEmojis(context)
                },
                {
                    parameters: ['role'],
                    description: 'Returns an array of emojis whitelisted for the provided `role`',
                    exampleCode: 'Cool gang has {length;{emojis;Cool gang}} emojis.',
                    exampleOut: 'Cool gang has 6 emojis.',
                    returns: 'string[]',
                    execute: (ctx, [role]) => this.getEmojisForRole(ctx, role.value)
                }
            ]
        });
    }

    public getAllEmojis(context: BBTagContext): string[] {
        return context.guild.emojis.map(e => `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`);
    }

    public async getEmojisForRole(context: BBTagContext, roleStr: string): Promise<string[]> {
        const role = await context.queryRole(roleStr, { noErrors: true, noLookup: true });

        // if (role === undefined)
        //     throw new RoleNotFoundError(roleStr) //TODO add this to other role subtags too, but when versioning is a thing to avoid incompatibilities

        const roleId = role?.id ?? roleStr;

        const emojis = context.guild.emojis.filter(e => (e.roles as string[] | undefined)?.includes(roleId) === true)
            .map(e => `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`);
        return emojis;
    }
}
