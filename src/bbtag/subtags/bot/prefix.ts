import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class PrefixSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'prefix',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the command prefix used to call this bbtag.',
                    exampleCode: 'Your prefix is {prefix}',
                    exampleOut: 'Your prefix is b!',
                    returns: 'string',
                    execute: ctx => this.getPrefix(ctx)
                }
            ]
        });
    }

    public async getPrefix(context: BBTagContext): Promise<string> {
        if (context.prefix !== undefined)
            return context.prefix;

        const prefix = await context.database.guilds.getSetting(context.guild.id, 'prefix');
        switch (typeof prefix) {
            case 'string': return prefix;
            case 'undefined': return context.util.defaultPrefix;
            default: return prefix[0];
        }
    }
}
