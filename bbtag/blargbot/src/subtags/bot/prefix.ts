import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class PrefixSubtag extends Subtag {
    public constructor() {
        super({
            name: 'prefix',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
