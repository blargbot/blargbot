import moment from 'moment-timezone';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

export class GuildCreatedAtSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildCreatedAt',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['format?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.getGuildCreatedDate(ctx, format.value)
                }
            ]
        });
    }

    public getGuildCreatedDate(context: BBTagContext, format: string): string {
        return moment(context.guild.createdAt).utcOffset(0).format(format);
    }
}
