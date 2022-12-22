import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

export class GuildIdSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildId',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getGuildId(ctx)
                }
            ]
        });
    }

    public getGuildId(context: BBTagContext): string {
        return context.guild.id;
    }
}
