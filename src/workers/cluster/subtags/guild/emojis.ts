import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

//TODO IMO this should return an array of emoji IDs instead of an array of emojis
export class EmojisSubtag extends Subtag {
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
                    execute: (context) => context.guild.emojis.cache.map(e => `<${e.animated ?? false ? 'a' : ''}:${e.name ?? ''}:${e.id}>`)
                },
                {
                    parameters: ['role'],
                    description: 'Returns an array of emojis whitelisted for the provided `role`',
                    exampleCode: 'Cool gang has {length;{emojis;Cool gang}} emojis.',
                    exampleOut: 'Cool gang has 6 emojis.',
                    returns: 'string[]',
                    execute: (ctx/*, [role]*/) => this.getEmojisForRole(ctx/*, role.value*/)
                }
            ]
        });
    }

    //! Doesn't work, but compatibility™
    //* The code commented below is the working code, however to keep compatibility the old code is still used
    public /*async*/ getEmojisForRole(context: BBTagContext/*, roleStr*/): /*Promise<*/string[]/*>*/ {
        const emojis = context.guild.emojis.cache.filter(e => e.roles.cache.size > 0)
            .map(e => `<${e.animated ?? false ? 'a' : ''}:${e.name ?? ''}:${e.id}>`);
        return emojis;

        // const role = await context.getRole(roleStr, {
        //     quiet: true, suppress: true,
        //     label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
        // });

        // if (role === undefined) {
        //     throw new RoleNotFoundError(roleStr) //TODO add this to other role subtags too, but when versioning is a thing to avoid incompatibilities
        // }
        // const emojis = context.guild.emojis.filter(e => e.roles.cache.has(role.id))
        //     .map(e => `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`);
        // return emojis;
    }
}
